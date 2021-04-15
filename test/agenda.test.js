'use strict';

const mock = require('egg-mock');

describe('test/agenda.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/agenda-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should GET /', () => {
    return app.httpRequest()
      .get('/')
      .expect('hi, agenda')
      .expect(200);
  });
});
