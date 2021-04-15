'use strict';

const {Agenda} = require('agenda');
const awaitFirst = require('await-first');
const path = require('path');

function createClient(app) {
    const config = Object.assign({}, app.config.agenda);
    const connection_options = {
        db: {
            address: config.db,
            collection: config.collection,
            options: {server: {auto_reconnect: true}}
        }
    };
    let agenda = new Agenda(connection_options);

    agenda.name('AGENDA - ' + process.pid);

    // 设置监听
    agenda.on('start', job => {
        app.logger.info('[egg-agenda]', 'agenda启动服务APP: ', job.attrs.name);
    });

    agenda.on('complete', job => {
        app.logger.info('[egg-agenda]', 'agenda完成任务: ', job.attrs.name, job.attrs.data);
        if (!job.attrs.nextRunAt) {
            job.remove(function (err) {
                app.logger.info('[egg-agenda]', 'agenda删除任务: ', err, job.attrs.name);
            });
        }
    });

    agenda.on('fail', job => {
        app.logger.info('[egg-agenda]', '检测到job失败: ', job.attrs.name);
        app.logger.info('[egg-agenda]', '失败时间: ', job.attrs.failedAt);
        app.logger.info('[egg-agenda]', '失败原因: ', job.attrs.failReason);
        agenda.stop();
    });

    agenda.on('ready', async () => {
        await agenda.start();
        app.logger.info('[egg-agenda]', 'agenda启动完毕');
        app.loader.loadToApp(path.join(app.config.baseDir, 'app/job'));
        app.logger.info('[egg-agenda]', 'agenda加载job完毕');
    });

    app.beforeStart(async () => {
        await awaitFirst(agenda, ['ready', 'fail']);
    });

    return agenda;
}

module.exports = app => {
    app.agenda = createClient(app);
    app.agenda.util = {
        removeJobs: async (props) => {
            const jobs = await app.agenda.jobs(props);
            return await Promise.allSettled(jobs.map((job) => job.remove()));
        }
    };
};

