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
				.send(issue)
				.end(function (err, res) {
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
					assert.isObject(res.body);
					assert.property(res.body, 'issue_title');
					assert.property(res.body, 'issue_text');
					assert.property(res.body, 'created_by');
					// assert.property(res.body, 'assigned_to');  //these are not required
					// assert.property(res.body, 'status_text');
					done();
				});
		});

		test('Missing required fields', function (done) {
			const issue = {
				created_by: 'required_author',
			};
			chai
				.request(server)
				.keepOpen()
				.post('/api/issues/:project')
				.send(issue)
				.end(function (err, res) {
					assert.equal(res.status, 400);
					assert.isObject(res.body);
					assert.property(res.body, 'error');
					assert.equal(res.body.error, 'required field(s) missing');
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
	});

	test('View issues with one filter', function (done) {
		chai
			.request(server)
			.keepOpen()
			.get('/api/issues/:project??assigned_to=Ben')
			.end(function (err, res) {
				assert.equal(
					res.body.every((issue) => issue.assigned_to === 'Ben'),
					true
				);
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
	let issueId;

	before(function (done) {
		chai
			.request(server)
			.keepOpen()
			.post('/api/issues/:project')
			.send({
				issue_title: 'Issue to be updated',
				issue_text: 'You should not be able to see this issue',
				created_by: 'The Admin',
			})
			.end(function (err, res) {
				issueId = res.body._id;
				done();
			});
	});

	test('Update one field of an issue', function (done) {
		chai
			.request(server)
			.keepOpen()
			.put('/api/issues/:project')
			.send({
				_id: issueId,
				issue_title: 'Updated Title',
			})
			.end(function (err, res) {
				assert.equal(res.status, 200);
				assert.equal(res.body.result, 'successfully updated');
				assert.equal(res.body._id, issueId);
				assert.equal(res.body.issue_title, 'Updated Title');
				done();
			});
	});

	test('Update multiple fields of an issue', function (done) {
		const updates = {
			_id: issueId,
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
				// assert.equal(
				// 	res.body,
				// 	`{"result":"successfully updated","_id":"${issueId}"}`
				// );
				assert.equal(res.body.result, 'successfully updated');
				assert.equal(res.body._id, issueId);

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
				assert.equal(res.body.error, 'missing _id');
				done();
			});
	});

	test('Update an issue with no fields to update', function (done) {
		chai
			.request(server)
			.keepOpen()
			.put('/api/issues/:project')
			.send({
				_id: issueId,
			})
			.end(function (err, res) {
				assert.equal(res.status, 400);
				assert.equal(res.body.error, 'no update field(s) sent');
				assert.equal(res.body._id, issueId);
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
				assert.equal(res.body.error, 'could not update');
				done();
			});
	});
});

suite('DELETE /api/issues/{project} ', function () {
	let issueId;

	before(function (done) {
		chai
			.request(server)
			.keepOpen()
			.post('/api/issues/:project')
			.send({
				issue_title: 'Issue to be deleted',
				issue_text: 'You should not be able to see this issue',
				created_by: 'The Admin',
			})
			.end(function (err, res) {
				issueId = res.body._id;
				done();
			});
	});

	test('Delete an issue with valid _id', function (done) {
		chai
			.request(server)
			.keepOpen()
			.delete('/api/issues/:project')
			.send({
				_id: issueId,
			})
			.end(function (err, res) {
				assert.equal(res.status, 200);

				console.log('mmmmmmmmmmmmmm', res.text);
				assert.equal(
					res.text,
					`{"result":"successfully deleted","_id":"${issueId}"}`
				);
				assert.equal(res.body._id, issueId);
				done();
			});
	});

	test('Delete an issue with invalid _id', function (done) {
		chai
			.request(server)
			.keepOpen()
			.delete('/api/issues/:project')
			.send({
				_id: 'invalidIdString',
			})
			.end(function (err, res) {
				assert.equal(res.status, 400);
				assert.equal(
					res.text,
					`{"error":"could not delete","_id":"invalidIdString"}`
				);
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
				assert.equal(res.text, `{"error":"missing _id"}`);
				assert.equal(res.body.error, 'missing _id');
				done();
			});
	});
});
