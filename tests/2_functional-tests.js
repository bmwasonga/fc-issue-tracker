const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const { before } = require('mocha');

const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
	this.timeout(5000);
	const project = ':project'; // Replace ":project" with a test project name

	// POST tests
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
					assert.containsAllKeys(res.body, [
						'issue_title',
						'issue_text',
						'created_by',
						'assigned_to',
						'status_text',
						'_id',
						'created_on',
						'updated_on',
						'open',
					]);
					assert.isBoolean(res.body.open);
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
					assert.containsAllKeys(res.body, [
						'issue_title',
						'issue_text',
						'created_by',
					]);
					done();
				});
		});

		test('Missing required fields', function (done) {
			const issue = { created_by: 'Ted' };

			chai
				.request(server)
				.post(`/api/issues/${project}`)
				.send(issue)
				.end((err, res) => {
					if (err) return done(err);
					assert.equal(res.status, 200);
					assert.isObject(res.body);
					assert.propertyVal(res.body, 'error', 'required field(s) missing');
					assert.equal(res.text, '{"error":"required field(s) missing"}');
					assert.equal(res.body.error, 'required field(s) missing');
					done();
				});
		});
	});

	// GET tests
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
						assert.containsAllKeys(issue, [
							'issue_title',
							'issue_text',
							'created_by',
							'assigned_to',
							'status_text',
							'open',
							'created_on',
							'updated_on',
						]);
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
						assert.isTrue(issue.open);
						assert.equal(issue.assigned_to, 'Ben');
					});
					done();
				});
		});
	});

	// PUT tests
	suite('PUT /api/issues/{project}', function () {
		let issueId;

		before(function (done) {
			chai
				.request(server)
				.post(`/api/issues/${project}`)
				.send({
					issue_title: 'Issue to be updated',
					issue_text: 'Update this',
					created_by: 'Rodrigo',
					assigned_to: 'Bob',
					status_text: 'Urgent',
				})
				.end((err, res) => {
					issueId = res.body._id;
					done();
				});
		});

		test('Update one field of an issue', function (done) {
			chai
				.request(server)
				.put(`/api/issues/${project}`)
				.send({ _id: issueId, issue_title: 'Updated Title' })
				.end((err, res) => {
					if (err) return done(err);
					assert.equal(res.status, 200);
					assert.propertyVal(res.body, 'result', 'successfully updated');
					assert.propertyVal(res.body, '_id', issueId);
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
					assert.propertyVal(res.body, 'result', 'successfully updated');
					assert.propertyVal(res.body, '_id', issueId);
					assert.deepEqual(
						res.text,
						'{"result":"successfully updated","_id":"' + issueId + '"}'
					);

					// Check that issue was updated
					chai
						.request(server)
						.get(`/api/issues/${project}`)
						.query({ _id: issueId })
						.end((err, res) => {
							if (err) return done(err);
							const issue = res.body[0];
							assert.equal(res.status, 200);
							assert.equal(issue.issue_title, 'Multiple Updates');
							assert.equal(issue.assigned_to, 'Tester');
							assert.equal(issue.status_text, 'In Progress');
							assert.isAbove(
								new Date(issue.updated_on),
								new Date(issue.created_on)
							);
							done();
						});
				});
		});

		test('Update an issue with missing _id', function (done) {
			chai
				.request(server)
				.put(`/api/issues/${project}`)
				.send({
					assigned_to: 'Testing',
					status_text: 'updating',
					issue_text: 'This is and has been updated',
					created_by: 'Ben',
				})
				.end((err, res) => {
					if (err) return done(err);
					assert.equal(res.status, 200);
					assert.equal(res.body.error, 'missing _id');
					assert.equal(res.text, '{"error":"missing _id"}');
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
					assert.equal(res.status, 200);
					assert.propertyVal(res.body, 'error', 'no update field(s) sent');
					assert.propertyVal(res.body, '_id', issueId);
					assert.deepEqual(
						res.text,
						`{"error":"no update field(s) sent","_id":"${issueId}"}`
					);
					done();
				});
		});

		test('Update an issue with invalid _id', function (done) {
			chai
				.request(server)
				.put(`/api/issues/${project}`)
				.send({
					_id: '5f665eb46e296g6b9b6a504d',
					issue_text: 'New Invalid Text',
				})
				.end((err, res) => {
					if (err) return done(err);
					assert.isObject(res.body);
					assert.equal(res.status, 200);
					assert.equal(res.body.error, 'could not update');
					assert.equal(res.body._id, '5f665eb46e296g6b9b6a504d');
					// console.log('.....', res.text);
					assert.deepEqual(
						res.text,
						`{"error":"could not update","_id":"${res.body._id}"}`
					);
					done();
				});
		});
	});

	// DELETE tests
	suite('DELETE /api/issues/{project}', function () {
		let issueId;

		before(function (done) {
			chai
				.request(server)
				.post(`/api/issues/${project}`)
				.send({
					issue_title: 'Issue to be deleted',
					issue_text: 'This will be deleted',
					created_by: 'Admin',
				})
				.end((err, res) => {
					issueId = res.body._id;
					done();
				});
		});

		test('Delete an issue with valid _id', function (done) {
			chai
				.request(server)
				.delete(`/api/issues/${project}`)
				.send({ _id: issueId })
				.end((err, res) => {
					if (err) return done(err);
					assert.equal(res.status, 200);
					assert.propertyVal(res.body, 'result', 'successfully deleted');
					assert.deepEqual(
						res.text,
						`{"result":"successfully deleted","_id":"${res.body._id}"}`
					);
					assert.propertyVal(res.body, '_id', issueId);
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
					assert.equal(res.status, 200);
					assert.propertyVal(res.body, 'error', 'could not delete');
					assert.deepEqual(
						res.text,
						`{"error":"could not delete","_id":"${res.body._id}"}`
					);
					done();
				});
		});

		test('Delete an issue with missing _id', function (done) {
			chai
				.request(server)
				.delete(`/api/issues/${project}`)
				.send({ _id: '' })
				.end((err, res) => {
					if (err) return done(err);
					assert.equal(res.status, 200);
					assert.propertyVal(res.body, 'error', 'missing _id');
					assert.deepEqual(res.text, '{"error":"missing _id"}');
					done();
				});
		});
	});
});
