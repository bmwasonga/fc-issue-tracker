const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
	this.timeout(5000);
	const project = 'test-project'; // Replace ":project" with a test project name
	let issueId; // Store reusable issue ID

	suite('POST /api/issues/{project}', function () {
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
				.post(`/api/issues/${project}`)
				.send(issue)
				.end((err, res) => {
					if (err) return done(err);
					assert.equal(res.status, 200);
					assert.isObject(res.body);
					assert.property(res.body, 'issue_title');
					assert.property(res.body, 'issue_text');
					assert.property(res.body, 'created_by');
					assert.property(res.body, 'assigned_to');
					assert.property(res.body, 'status_text');
					assert.property(res.body, '_id');
					assert.property(res.body, 'created_on');
					assert.property(res.body, 'updated_on');
					assert.isBoolean(res.body.open);
					issueId = res.body._id; // Store issue ID for later tests
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
				.post(`/api/issues/${project}`)
				.send(issue)
				.end((err, res) => {
					if (err) return done(err);
					assert.equal(res.status, 200);
					assert.isObject(res.body);
					assert.property(res.body, 'issue_title');
					assert.property(res.body, 'issue_text');
					assert.property(res.body, 'created_by');
					done();
				});
		});

		test('Missing required fields', function (done) {
			const issue = {
				created_by: 'Functional Test',
			};

			chai
				.request(server)
				.post(`/api/issues/${project}`)
				.send(issue)
				.end((err, res) => {
					if (err) return done(err);
					assert.equal(res.status, 400);
					assert.isObject(res.body);
					assert.property(res.body, 'error');
					assert.equal(res.body.error, 'required field(s) missing');
					done();
				});
		});
	});

	suite('GET /api/issues/{project}', function () {
		test('View all issues on a project', function (done) {
			chai
				.request(server)
				.get(`/api/issues/${project}`)
				.end((err, res) => {
					if (err) return done(err);
					assert.equal(res.status, 200);
					assert.isArray(res.body);
					res.body.forEach((issue) => {
						assert.property(issue, 'issue_title');
						assert.property(issue, 'issue_text');
						assert.property(issue, 'created_by');
						assert.property(issue, 'assigned_to');
						assert.property(issue, 'status_text');
						assert.property(issue, 'open');
						assert.property(issue, 'created_on');
						assert.property(issue, 'updated_on');
					});
					done();
				});
		});

		test('View issues with one filter', function (done) {
			chai
				.request(server)
				.get(`/api/issues/${project}`)
				.query({ assigned_to: 'Ben' })
				.end((err, res) => {
					if (err) return done(err);
					assert.equal(res.status, 200);
					assert.isArray(res.body);
					res.body.forEach((issue) => {
						assert.equal(issue.assigned_to, 'Ben');
					});
					done();
				});
		});

		test('View issues with multiple filters', function (done) {
			chai
				.request(server)
				.get(`/api/issues/${project}`)
				.query({ open: true, assigned_to: 'Ben' })
				.end((err, res) => {
					if (err) return done(err);
					assert.equal(res.status, 200);
					assert.isArray(res.body);
					res.body.forEach((issue) => {
						assert.equal(issue.open, true);
						assert.equal(issue.assigned_to, 'Ben');
					});
					done();
				});
		});
	});

	suite('PUT /api/issues/{project}', function () {
		test('Update one field of an issue', function (done) {
			chai
				.request(server)
				.put(`/api/issues/${project}`)
				.send({ _id: issueId, issue_title: 'Updated Title' })
				.end((err, res) => {
					if (err) return done(err);
					assert.equal(res.status, 200);
					assert.equal(res.body.result, 'successfully updated');
					assert.equal(res.body._id, issueId);
					done();
				});
		});

		test('Update multiple fields of an issue', function (done) {
			const updates = {
				_id: issueId,
				issue_title: 'Multiple Updates',
				assigned_to: 'Tester',
				status_text: 'In Progress',
			};

			chai
				.request(server)
				.put(`/api/issues/${project}`)
				.send(updates)
				.end((err, res) => {
					if (err) return done(err);
					assert.equal(res.status, 200);
					assert.equal(res.body.result, 'successfully updated');
					assert.equal(res.body._id, issueId);
					done();
				});
		});

		test('Update an issue with missing _id', function (done) {
			chai
				.request(server)
				.put(`/api/issues/${project}`)
				.send({ _id: '' })
				.end((err, res) => {
					if (err) return done(err);
					assert.equal(res.status, 400);
					assert.equal(res.body.error, 'missing _id');
					done();
				});
		});

		test('Update an issue with no fields to update', function (done) {
			chai
				.request(server)
				.put(`/api/issues/${project}`)
				.send({ _id: issueId })
				.end((err, res) => {
					if (err) return done(err);
					assert.equal(res.status, 400);
					assert.equal(res.body.error, 'no update field(s) sent');
					assert.equal(res.body._id, issueId);
					done();
				});
		});

		test('Update an issue with invalid _id', function (done) {
			chai
				.request(server)
				.put(`/api/issues/${project}`)
				.send({ _id: 'invalid_id', issue_title: 'Invalid Update' })
				.end((err, res) => {
					if (err) return done(err);
					assert.equal(res.status, 400);
					assert.equal(res.body.error, 'could not update');
					done();
				});
		});
	});

	suite('DELETE /api/issues/{project}', function () {
		test('Delete an issue with valid _id', function (done) {
			chai
				.request(server)
				.delete(`/api/issues/${project}`)
				.send({ _id: issueId })
				.end((err, res) => {
					if (err) return done(err);
					assert.equal(res.status, 200);
					assert.equal(res.body.result, 'successfully deleted');
					assert.equal(res.body._id, issueId);
					done();
				});
		});

		test('Delete an issue with invalid _id', function (done) {
			chai
				.request(server)
				.delete(`/api/issues/${project}`)
				.send({ _id: 'invalidIdString' })
				.end((err, res) => {
					if (err) return done(err);
					assert.equal(res.status, 400);
					assert.equal(res.body.error, 'could not delete');
					done();
				});
		});

		test('Delete an issue with missing _id', function (done) {
			chai
				.request(server)
				.delete(`/api/issues/${project}`)
				.send({})
				.end((err, res) => {
					if (err) return done(err);
					assert.equal(res.status, 400);
					assert.equal(res.body.error, 'missing _id');
					done();
				});
		});
	});
});
