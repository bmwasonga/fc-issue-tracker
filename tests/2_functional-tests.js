const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
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
				.post('/api/issues/:project')
				.send(issue)
				.end(function (err, res) {
					assert.equal(res.status, 200);
					assert.equal(res.body.issue_title, issue.issue_title);
					assert.equal(res.body.issue_text, issue.issue_text);
					assert.equal(res.body.created_by, issue.created_by);
					assert.equal(res.body.assigned_to, issue.assigned_to);
					assert.equal(res.body.status_text, issue.status_text);
				});
			done();
		});
		test('Only required fields', function (done) {
			const issue = {
				issue_title: 'Title',
				issue_text: 'text',
				created_by: 'Functional Test',
			};

			chai
				.request(server)
				.post('/api/issues/:project')
				.send(issue)
				.end(function (err, res) {
					assert.equal(res.status, 200);
					assert.equal(res.body.issue_title, issue.issue_title);
					assert.equal(res.body.issue_text, issue.issue_text);
					assert.equal(res.body.created_by, issue.created_by);
					assert.equal(res.body.assigned_to, '');
					assert.equal(res.body.status_text, '');
				});
			done();
		});
		test('Missing required fields', function (done) {
			const issue = {
				issue_title: '',
				issue_text: '',
				created_by: '',
			};
			chai
				.request(server)
				.post('/api/issues/:project')
				.send(issue)
				.end(function (err, res) {
					assert.equal(res.status, 404);
					assert.deepEqual(res.body, { error: 'required field(s) missing' });
				});
			done();
		});
	});
	suite('GET /api/issues/{project} ', function () {
		test('Every field filled in', function (done) {
			chai
				.request(server)
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
				});
			done();
		});
		test('Issues with one filter', function (done) {
			const query = { open: true, assigned_to: 'ben', created_by: 'Ben' }; // example multi-query
			chai
				.request(server)
				.get('/api/issues/:project')
				.query(query)
				.end(function (err, res) {
					assert.equal(res.status, 200);
					assert.isArray(res.body);
				});
			done();
		});
		test('Issues with multiple filters', function (done) {
			chai
				.request(server)
				.get('/api/issues/:project?open=true&assigned_to=ben')
				.end(function (err, res) {
					assert.equal(res.status, 200);
					assert.isArray(res.body);
					//this might need to be revisited to contain the status which is on the param
				});
			done();
		});
	});
	suite('PUT /api/issues/{project} ', function () {
		test('Update one field of an issue', function (done) {
			chai
				.request(server)
				.put('/api/issues/:project')
				.send({
					assigned_to: 'Testing',
					status_text: 'updated',
					open: true,
					_id: '1',
					issue_title: 'This cannot be empty',
					issue_text: 'This is and has been updated',
					created_by: 'Mo',
				})
				.end(function (err, res) {
					// assert.equal(res.status, 200);
					// assert.equal(res.body.result, 'successfully updated');
					//include assertions to have the comparisons of the fields
				});
			done();
		});
		test('Update multiple fields of an issue', function (done) {
			chai
				.request(server)
				.put('/api/issues/:project')
				.send({
					assigned_to: 'Testing',
					status_text: 'updated',
					open: true,
					_id: '1',
					issue_title: 'this cannnot be blank',
					issue_text: 'This is and has been updated',
					created_by: 'Mo',
					// TO-Do:  update multiple issues
				})
				.end(function (err, res) {
					// assert.equal(res.status, 200);
					// assert.equal(res.body.result, 'successfully updated');
					//include assertions to have the comparisons of the fields
				});
			done();
		});
		test('Update an issue with  missing ID', function (done) {
			chai
				.request(server)
				.put('/api/issues/:project')
				.send({
					assigned_to: 'Testing',
					status_text: 'updated',
					open: true,
					_id: '',
					issue_title: '',
					issue_text: 'This is and has been updated',
					created_by: 'Mo',
					// TO-Do:  update multiple issues
				})
				.end(function (err, res) {
					assert.equal(res.status, 400);
					assert.equal(res.body.error, 'missing _id');
				});
			done();
		});

		test('Update an issue with  no fields to update', function (done) {
			chai
				.request(server)
				.put('/api/issues/:project')
				.send({
					assigned_to: 'Testing',
					status_text: 'updated',
					open: true,
					_id: '1',
					issue_title: '',
					issue_text: 'This is and has been updated',
					created_by: 'Mo',
				})
				.end(function (err, res) {
					// assert.equal(res.status, 200);
					//create assertion to have the dates be different
				});
			done();
		});
		test('Update an issue with an invadid Id', function (done) {
			chai
				.request(server)
				.put('/api/issues/:project')
				.send({
					assigned_to: 'Testing',
					status_text: 'updated',
					open: true,
					_id: 34,
					issue_title: '',
					issue_text: 'This is and has been updated',
					created_by: 'Mo',
				})
				.end(function (err, res) {
					assert.equal(res.status, 400);
					//create assertion to have the dates be different
				});
			done();
		});
	});
	suite('DELETE /api/issues/{project} ', function () {
		test('Delete an issue with a valid ID', function (done) {
			chai
				.request(server)
				.delete('/api/issues/:project')
				.send({
					_id: '1',
				})
				.end(function (err, res) {
					assert.equal(res.status, 200);
					//create assertion to have the dates be different
				});
			done();
		});

		test('Delete an issue with an invalid ID', function (done) {
			chai
				.request(server)
				.delete('/api/issues/:project')
				.send({
					_id: 45,
				})

				.end(function (err, res) {
					assert.equal(res.status, 400);
				});
			done();
		});
		test('Delete an issue with no ID', function (done) {
			chai
				.request(server)
				.delete('/api/issues/:project')
				.send({
					_id: '',
				})
				.end(function (err, res) {
					assert.equal(res.status, 400);
				});
			done();
		});
	});
});

after(function () {
	chai.request(server).get('/');
});
