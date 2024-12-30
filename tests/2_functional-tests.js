const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
	this.timeout(5000);
	suite('POST /api/issues/{project} ', function () {
		test('Every field filled in', function (done) {
			const issue = {
				issue_title: 'Title',
				issue_text: 'text',
				created_by: 'Functional Test',
				assigned_to: 'Ben',
				status_text: 'In QA',
			};

			chai
				.request(server)
				.keepOpen()
				.post('/api/issues/:project')
				.send(issue)
				.end(function (err, res) {
					assert.equal(res.status, 200);
					assert.equal(res.body.issue_title, issue.issue_title);
					assert.equal(res.body.issue_text, issue.issue_text);
					assert.equal(res.body.created_by, issue.created_by);
					assert.equal(res.body.assigned_to, issue.assigned_to);
					assert.equal(res.body.status_text, issue.status_text);
					done();
				});
		});

		test('Only required fields', function (done) {
			const issue = {
				issue_title: 'Title',
				issue_text: 'text',
				created_by: 'Functional Test',
			};

			chai
				.request(server)
				.keepOpen()
				.post('/api/issues/:project')
				.send(issue)
				.end(function (err, res) {
					assert.equal(res.status, 200);
					assert.equal(res.body.issue_title, issue.issue_title);
					assert.equal(res.body.issue_text, issue.issue_text);
					assert.equal(res.body.created_by, issue.created_by);
					assert.equal(res.body.assigned_to, '');
					assert.equal(res.body.status_text, '');
					done();
				});
		});

		test('Missing required fields', function (done) {
			const issue = {
				issue_title: '',
				issue_text: '',
				created_by: '',
			};

			chai
				.request(server)
				.keepOpen()
				.post('/api/issues/:project')
				.send(issue)
				.end(function (err, res) {
					assert.equal(res.status, 404);
					assert.deepEqual(res.body, { error: 'required field(s) missing' });
					done();
				});
		});
	});

	suite('GET /api/issues/{project} ', function () {
		test('View all issues on a project', function (done) {
			chai
				.request(server)
				.keepOpen()
				.get('/api/issues/:project')
				.end(function (err, res) {
					assert.equal(res.status, 200);
					assert.isArray(res.body);
					assert.property(res.body[0], 'issue_title');
					assert.property(res.body[0], 'issue_text');
					assert.property(res.body[0], 'created_by');
					assert.property(res.body[0], 'assigned_to');
					assert.property(res.body[0], 'status_text');
					assert.property(res.body[0], 'open');
					assert.property(res.body[0], 'created_on');
					assert.property(res.body[0], 'updated_on');
					done();
				});
		});

		test('View issues with one filter', function (done) {
			const query = {
				open: true,
				assigned_to: 'ben',
			};

			chai
				.request(server)
				.keepOpen()
				.get('/api/issues/:project')
				.query(query)
				.end(function (err, res) {
					assert.equal(res.status, 200);
					assert.isArray(res.body);
					res.body.forEach((issue) => {
						assert.equal(issue.open, true);
						assert.equal(issue.assigned_to.toLowerCase(), 'ben');
					});
					done();
				});
		});

		test('View issues with multiple filters', function (done) {
			chai
				.request(server)
				.keepOpen()
				.get('/api/issues/:project')
				.query({
					open: true,
					assigned_to: 'ben',
				})
				.end(function (err, res) {
					assert.equal(res.status, 200);
					assert.isArray(res.body);
					res.body.forEach((issue) => {
						assert.equal(issue.open, true);
						assert.equal(issue.assigned_to.toLowerCase(), 'ben');
					});
					done();
				});
		});
	});

	suite('PUT /api/issues/{project} ', function () {
		test('Update one field of an issue', function (done) {
			chai
				.request(server)
				.keepOpen()
				.put('/api/issues/:project')
				.send({
					_id: '1',
					issue_title: 'Updated Title',
				})
				.end(function (err, res) {
					assert.equal(res.status, 200);
					assert.equal(res.body.result, 'successfully updated');
					assert.equal(res.body._id, '1');
					done();
				});
		});

		test('Update multiple fields of an issue', function (done) {
			const updates = {
				_id: '1',
				issue_title: 'Multiple Updates',
				assigned_to: 'Testing',
				status_text: 'In Progress',
			};

			chai
				.request(server)
				.keepOpen()
				.put('/api/issues/:project')
				.send(updates)
				.end(function (err, res) {
					assert.equal(res.status, 200);
					assert.equal(res.body.result, 'successfully updated');
					assert.equal(res.body._id, '1');

					done();
				});
		});

		test('Update an issue with missing _id', function (done) {
			chai
				.request(server)
				.keepOpen()
				.put('/api/issues/:project')
				.send({
					_id: '',
				})
				.end(function (err, res) {
					assert.equal(res.status, 400);
					assert.equal(res.body.error, 'missing id');
					done();
				});
		});

		test('Update an issue with no fields to update', function (done) {
			chai
				.request(server)
				.keepOpen()
				.put('/api/issues/:project')
				.send({
					_id: '1',
				})
				.end(function (err, res) {
					assert.equal(res.status, 400);
					assert.equal(res.body.error, 'no update field(s) sent');
					assert.equal(res.body._id, '1');
					done();
				});
		});

		test('Update an issue with invalid _id', function (done) {
			chai
				.request(server)
				.keepOpen()
				.put('/api/issues/:project')
				.send({
					_id: 'invalid_id',
					issue_title: 'Invalid Update',
				})
				.end(function (err, res) {
					assert.equal(res.status, 400);
					// console.log('........', res.body.error);

					// assert.equal(res.body.error, 'missing _id');
					assert.equal(res.body.error, 'issue not found');
					done();
				});
		});
	});

	suite('DELETE /api/issues/{project} ', function () {
		test('Delete an issue with valid _id', function (done) {
			chai
				.request(server)
				.keepOpen()
				.delete('/api/issues/:project')
				.send({
					_id: '1',
				})
				.end(function (err, res) {
					assert.equal(res.status, 200);
					assert.equal(res.body.result, 'successfully deleted');
					assert.equal(res.body._id, '1');
					done();
				});
		});

		test('Delete an issue with invalid _id', function (done) {
			chai
				.request(server)
				.keepOpen()
				.delete('/api/issues/:project')
				.send({
					_id: 'invalid_id',
				})
				.end(function (err, res) {
					assert.equal(res.status, 400);
					// assert.equal(res.body.error, 'could not delete');
					assert.equal(res.body.error, 'invalid id');
					done();
				});
		});

		test('Delete an issue with missing _id', function (done) {
			chai
				.request(server)
				.keepOpen()
				.delete('/api/issues/:project')
				.send({})
				.end(function (err, res) {
					assert.equal(res.status, 400);
					assert.equal(res.body.error, 'missing id');
					done();
				});
		});
	});
});
