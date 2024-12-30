'use strict';

let issues = [];

module.exports = function (app) {
	app
		.route('/api/issues/:project')
		.get(function (req, res) {
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
			let newIssue = {
				_id: (issues.length + 1).toString(),
				title: req.body.issue_title,
				text: req.body.issue_text,
				created_on: new Date(),
				updated_on: new Date(),
				created_by: req.body.created_by,
				assigned_to: req.body.assigned_to,
				open: true,
				status_text: req.body.status_text,
			};
			issues.push(newIssue);
			res.json(newIssue);
		})
		.put(function (req, res) {
			let project = req.params.project;
			let issueId = req.body._id;
			let issue = issues.find((issue) => issue._id === issueId);
			if (issue) {
				issue.title = req.body.issue_title || issue.title;
				issue.text = req.body.issue_text || issue.text;
				issue.created_by = req.body.created_by || issue.created_by;
				issue.assigned_to = req.body.assigned_to || issue.assigned_to;
				issue.status_text = req.body.status_text || issue.status_text;
				issue.open = req.body.open !== undefined ? req.body.open : issue.open;
				res.json(issue);
			} else {
				res.status(400).json({ error: 'Issue not found' });
			}
		})
		.delete(function (req, res) {
			let project = req.params.project;
			let issueId = req.body._id;
			let issueIndex = issues.findIndex((issue) => issue._id === issueId);
			if (issueIndex > -1) {
				issues.splice(issueIndex, 1);
				res.json({ message: 'Deleted issue with _id: ' + issueId });
			} else {
				res.status(400).json({ error: 'Issue not found' });
			}
		});
};
