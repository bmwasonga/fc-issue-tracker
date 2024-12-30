'use strict';

let issues = [];

module.exports = function (app) {
	app
		.route('/api/issues/:project')
		.get(async function (req, res) {
			let project = req.params.project;
			let query = req.query;
			let filteredIssues = issues;
			if (query) {
				if (query.open) {
					filteredIssues = filteredIssues.filter((issue) => issue.open);
				}
				if (query.assigned_to) {
					filteredIssues = filteredIssues.filter(
						(issue) => issue.assigned_to === query.assigned_to
					);
				}
				if (query.created_by) {
					filteredIssues = filteredIssues.filter(
						(issue) => issue.created_by === query.created_by
					);
				}
			}
			res.json(filteredIssues);
		})
		.post(function (req, res) {
			let project = req.params.project;

			const requiredFields = ['issue_title', 'issue_text', 'created_by'];
			if (
				requiredFields.some(
					(field) => !req.body.hasOwnProperty(field) || req.body[field] === ''
				)
			) {
				return res.status(404).json({ error: 'required field(s) missing' });
			}

			let newIssue = {
				_id: (issues.length + 1).toString(),
				issue_title: req.body.issue_title,
				issue_text: req.body.issue_text,
				created_on: new Date(),
				updated_on: new Date(),
				created_by: req.body.created_by,
				assigned_to: req.body.assigned_to || '',
				open: true,
				status_text: req.body.status_text || '',
			};
			issues.push(newIssue);
			res.json(newIssue);
		})
		.put(function (req, res) {
			let project = req.params.project;
			const issueId = req.body._id;

			if (!issueId) {
				return res.status(400).json({ error: 'missing id' });
			}

			const issue = issues.find((issue) => issue._id === issueId);

			if (!issue) {
				return res.status(400).json({ error: 'issue not found' });
			}

			const updateFields = [
				'issue_title',
				'issue_text',
				'created_by',
				'assigned_to',
				'status_text',
				'open',
			];

			const fieldsToUpdate = updateFields.filter((field) =>
				req.body.hasOwnProperty(field)
			);

			if (!fieldsToUpdate.length) {
				return res.status(400).json({
					error: 'no update field(s) sent',
					_id: issueId,
				});
			}

			fieldsToUpdate.forEach((field) => (issue[field] = req.body[field]));

			return res.status(200).json({
				result: 'successfully updated',
				_id: issueId,
			});
		})

		.delete(function (req, res) {
			const issueId = req.body._id;
			let project = req.params.project;

			// First check if _id exists
			if (!issueId) {
				return res.status(400).json({ error: 'missing id' });
			}

			try {
				let issueIndex = issues.findIndex((issue) => issue._id === issueId);

				if (issueIndex === -1) {
					return res.status(400).json({ error: 'invalid id', _id: issueId });
				}

				// Delete the issue
				issues.splice(issueIndex, 1);
				return res
					.status(200)
					.json({ result: 'successfully deleted', _id: issueId });
			} catch (err) {
				return res
					.status(400)
					.json({ error: 'could not delete', _id: issueId });
			}
		});
};
