'use strict';

let issues = [];

module.exports = function (app) {
	app
		.route('/api/issues/:project')
		.get(async function (req, res) {
			let project = req.params.project;
			let query = req.query;
			let filteredIssues = [...issues];

			filteredIssues = filteredIssues.filter(
				(issue) => issue.project === project
			);

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
			let project = req.params.project;

			const requiredFields = ['issue_title', 'issue_text', 'created_by'];
			if (
				requiredFields.some(
					(field) => !req.body[field] || req.body[field].trim() === ''
				)
			) {
				return res.status(400).json({ error: 'required field(s) missing' });
			}

			let newIssue = {
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

			issues.push(newIssue);
			res.json(newIssue);
		})
		.put(function (req, res) {
			const project = req.params.project;
			const issueId = req.body._id;

			if (!issueId) {
				return res.status(400).json({ error: 'missing _id' });
			}

			// Locate the existing issue
			const existingIssue = issues.find(
				(issue) => issue._id === issueId && issue.project === project
			);

			if (!existingIssue) {
				return res
					.status(400)
					.json({ error: 'could not update', _id: issueId });
			}

			// Fields to update and actual updates tracker
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

			// Process updates
			for (const field of updateFields) {
				if (req.body.hasOwnProperty(field)) {
					const newValue = req.body[field];
					const processedValue =
						field === 'open' ? Boolean(newValue) : (newValue || '').trim();

					// Check for required field validity
					if (
						['issue_title', 'issue_text', 'created_by'].includes(field) &&
						(!processedValue || processedValue === '')
					) {
						return res.status(400).json({ error: 'required field(s) missing' });
					}

					// Track updates only if values differ
					if (processedValue !== existingIssue[field]) {
						updates[field] = processedValue;
						hasActualUpdates = true;
					}
				}
			}

			// If no updates detected
			if (!hasActualUpdates) {
				return res.status(400).json({
					error: 'no update field(s) sent',
					_id: issueId,
				});
			}

			// Apply updates
			const updatedIssue = { ...existingIssue, ...updates };
			issues[issues.indexOf(existingIssue)] = updatedIssue;

			// Respond with success
			return res
				.status(200)
				.json({ result: 'successfully updated', _id: issueId });
		})

		// .put(function (req, res) {
		// 	let project = req.params.project;
		// 	const issueId = req.body._id;

		// 	if (!issueId) {
		// 		return res.status(400).json({ error: 'missing _id' });
		// 	}

		// 	const issueIndex = issues.findIndex(
		// 		(issue) => issue._id === issueId && issue.project === project
		// 	);

		// 	if (issueIndex === -1) {
		// 		return res
		// 			.status(400)
		// 			.json({ error: 'could not update', _id: issueId });
		// 	}

		// 	const existingIssue = issues[issueIndex];

		// 	// Fields that can be updated
		// 	const updateFields = [
		// 		'issue_title',
		// 		'issue_text',
		// 		'created_by',
		// 		'assigned_to',
		// 		'status_text',
		// 		'open',
		// 	];

		// 	// Check if any fields were sent for update
		// 	const updates = {};
		// 	let hasActualUpdates = false;

		// 	// Get only the fields that were explicitly sent in the request body
		// 	const updateRequest = {};
		// 	updateFields.forEach((field) => {
		// 		// Only include fields that were explicitly sent (even if they're empty strings)
		// 		if (req.body.hasOwnProperty(field)) {
		// 			updateRequest[field] = req.body[field];
		// 		}
		// 	});

		// 	// If no update fields were sent at all
		// 	if (Object.keys(updateRequest).length === 0) {
		// 		return res.status(400).json({
		// 			error: 'no update field(s) sent',
		// 			_id: issueId,
		// 		});
		// 	}

		// 	// Process each field that was sent in the request
		// 	for (const [field, newValue] of Object.entries(updateRequest)) {
		// 		// Handle required fields
		// 		if (['issue_title', 'issue_text', 'created_by'].includes(field)) {
		// 			// Check if required fields are empty or just whitespace
		// 			if (
		// 				newValue === undefined ||
		// 				newValue === null ||
		// 				newValue.trim() === ''
		// 			) {
		// 				return res.status(400).json({ error: 'required field(s) missing' });
		// 			}
		// 			const trimmedValue = newValue.trim();
		// 			if (trimmedValue !== existingIssue[field]) {
		// 				updates[field] = trimmedValue;
		// 				hasActualUpdates = true;
		// 			}
		// 		}
		// 		// Handle boolean field (open)
		// 		else if (field === 'open') {
		// 			const boolValue = Boolean(newValue);
		// 			if (boolValue !== existingIssue[field]) {
		// 				updates[field] = boolValue;
		// 				hasActualUpdates = true;
		// 			}
		// 		}
		// 		// Handle optional fields
		// 		else {
		// 			const trimmedValue = newValue?.trim() || '';
		// 			if (trimmedValue !== existingIssue[field]) {
		// 				updates[field] = trimmedValue;
		// 				hasActualUpdates = true;
		// 			}
		// 		}
		// 	}

		// 	// Check if any actual changes were found in the provided fields
		// 	if (!hasActualUpdates) {
		// 		return res.status(400).json({
		// 			error: 'no update field(s) sent',
		// 			_id: issueId,
		// 		});
		// 	}

		// })
		.delete(function (req, res) {
			const issueId = req.body._id;
			const project = req.params.project;

			if (!issueId) {
				return res.status(400).json({ error: 'missing _id' });
			}

			const issueIndex = issues.findIndex(
				(issue) => issue._id === issueId && issue.project === project
			);

			if (issueIndex === -1) {
				return res.status(400).json({
					error: 'could not delete',
					_id: issueId,
				});
			}

			issues.splice(issueIndex, 1);
			return res.status(200).json({
				result: 'successfully deleted',
				_id: issueId,
			});
		});
};
