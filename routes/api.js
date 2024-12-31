const issuesStore = (function () {
	let issues = [];
	return {
		get: () => issues,
		add: (issue) => issues.push(issue),
		update: (id, updates) => {
			const index = issues.findIndex((i) => i._id === id);
			if (index !== -1) {
				issues[index] = { ...issues[index], ...updates };
			}
		},
		remove: (id) => {
			issues = issues.filter((i) => i._id !== id);
		},
	};
})();

module.exports = function (app) {
	app
		.route('/api/issues/:project')
		.get(async function (req, res) {
			const project = req.params.project;
			const query = req.query;
			let filteredIssues = issuesStore
				.get()
				.filter((issue) => issue.project === project);

			if (Object.keys(query).length > 0) {
				filteredIssues = filteredIssues.filter((issue) => {
					return Object.entries(query).every(([key, value]) => {
						if (key === 'open') {
							return issue.open === (value === 'true');
						}
						if (key === '_id') {
							return issue._id === value;
						}
						return issue[key] && issue[key].toString() === value.toString();
					});
				});
			}

			res.json(filteredIssues);
		})
		.post(function (req, res) {
			const project = req.params.project;

			const requiredFields = ['issue_title', 'issue_text', 'created_by'];
			if (
				requiredFields.some(
					(field) => !req.body[field] || req.body[field].trim() === ''
				)
			) {
				return res.status(200).json({ error: 'required field(s) missing' });
			}

			const newIssue = {
				_id: Date.now().toString(),
				project: project,
				issue_title: req.body.issue_title.trim(),
				issue_text: req.body.issue_text.trim(),
				created_on: new Date(),
				updated_on: new Date(),
				created_by: req.body.created_by.trim(),
				assigned_to: req.body.assigned_to?.trim() || '',
				open: true,
				status_text: req.body.status_text?.trim() || '',
			};

			issuesStore.add(newIssue);
			res.json(newIssue);
		})
		.put(function (req, res) {
			const project = req.params.project;
			const issueId = req.body._id;

			if (!issueId) {
				return res.status(200).json({ error: 'missing _id' });
			}

			const existingIssue = issuesStore
				.get()
				.find((issue) => issue._id === issueId && issue.project === project);

			if (!existingIssue) {
				return res
					.status(200)
					.json({ error: 'could not update', _id: issueId });
			}

			const updateFields = [
				'issue_title',
				'issue_text',
				'created_by',
				'assigned_to',
				'status_text',
				'open',
			];

			const updates = {};
			let hasActualUpdates = false;

			for (const field of updateFields) {
				if (req.body.hasOwnProperty(field)) {
					const newValue = req.body[field];
					const processedValue =
						field === 'open' ? Boolean(newValue) : (newValue || '').trim();

					if (
						['issue_title', 'issue_text', 'created_by'].includes(field) &&
						(!processedValue || processedValue === '')
					) {
						return res.status(200).json({ error: 'required field(s) missing' });
					}

					if (processedValue !== existingIssue[field]) {
						updates[field] = processedValue;
						hasActualUpdates = true;
					}
				}
			}

			if (!hasActualUpdates) {
				return res.status(200).json({
					error: 'no update field(s) sent',
					_id: issueId,
				});
			}

			updates.updated_on = new Date(); // to update the time
			issuesStore.update(issueId, updates);

			res.status(200).json({ result: 'successfully updated', _id: issueId });
		})

		.delete(function (req, res) {
			const issueId = req.body._id;
			const project = req.params.project;

			if (!issueId) {
				return res.status(200).json({ error: 'missing _id' });
			}

			const issueExists = issuesStore
				.get()
				.some((issue) => issue._id === issueId && issue.project === project);

			if (!issueExists) {
				return res.status(200).json({
					error: 'could not delete',
					_id: issueId,
				});
			}

			issuesStore.remove(issueId);
			res.status(200).json({ result: 'successfully deleted', _id: issueId });
		});
};
