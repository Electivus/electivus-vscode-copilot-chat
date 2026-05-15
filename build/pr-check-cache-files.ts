/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

type Commit = {
	readonly sha: string;
	readonly committer: {
		readonly login: string;
	};
	readonly commit: {
		readonly verification: {
			readonly verified: boolean;
			readonly reason: string;
		};
	};
	readonly files: readonly PullRequestFile[];
}

type PullRequestFile = {
	readonly filename: string;
	readonly status: string;
}

type PullRequestCommit = {
	readonly sha: string;
}

type RepositoryPermission = {
	readonly permission: string;
}

const allowedCacheLayerPermissions = new Set(['admin', 'maintain', 'write']);

async function getCommit(repository: string, sha: string): Promise<Commit> {
	const { stdout, stderr } = await execAsync(
		`gh api -H "Accept: application/vnd.github+json" /repos/${repository}/commits/${sha}`, { maxBuffer: 25 * 1024 * 1024 });

	if (stderr) {
		throw new Error(`Error fetching commit ${sha} - ${stderr}`);
	}

	return JSON.parse(stdout) as Commit;
}

async function getPullRequestFiles(repository: string, pullRequestNumber: string): Promise<readonly PullRequestFile[]> {
	const { stdout, stderr } = await execAsync(
		`gh api -H "Accept: application/vnd.github+json" /repos/${repository}/pulls/${pullRequestNumber}/files --paginate`, { maxBuffer: 25 * 1024 * 1024 });

	if (stderr) {
		throw new Error(`Error fetching pull request files - ${stderr}`);
	}

	return JSON.parse(stdout) as readonly PullRequestFile[];
}

async function getPullRequestCommits(repository: string, pullRequestNumber: string): Promise<readonly string[]> {
	const { stdout, stderr } = await execAsync(
		`gh api -H "Accept: application/vnd.github+json" /repos/${repository}/pulls/${pullRequestNumber}/commits --paginate`, { maxBuffer: 25 * 1024 * 1024 });

	if (stderr) {
		throw new Error(`Error fetching pull request commits - ${stderr}`);
	}

	return JSON.parse(stdout).map((commit: PullRequestCommit) => commit.sha);
}

async function getRepositoryPermission(repository: string, username: string): Promise<string> {
	try {
		const { stdout, stderr } = await execAsync(
			`gh api -H "Accept: application/vnd.github+json" /repos/${repository}/collaborators/${encodeURIComponent(username)}/permission`,
			{ maxBuffer: 25 * 1024 * 1024 });

		if (stderr) {
			throw new Error(`Error fetching repository permission for ${username} - ${stderr}`);
		}

		return (JSON.parse(stdout) as RepositoryPermission).permission;
	} catch (error) {
		console.log(`     - Could not resolve repository permission for ${username}: ${error}`);
		return 'none';
	}
}

async function checkDatabaseFile(files: ReadonlyArray<PullRequestFile>): Promise<boolean> {
	const baseFile = files.find(f => f.filename.toLowerCase() === 'test/simulation/cache/base.sqlite');
	if (!baseFile) {
		console.log('✅ Pull request does not contain the base file.');
		return true;
	}

	const statusCheck = baseFile.status === 'modified';
	console.log(`🔍 Pull request contains the base file. Checking status...`);
	console.log(`   - 🗄️ ${baseFile.filename}; Status: ${baseFile.status} ${statusCheck ? '✅' : '⛔'}`);

	return statusCheck;
}

async function checkDatabaseLayerFiles(repository: string, pullRequestNumber: string, files: readonly PullRequestFile[])
	: Promise<{ statusCheck: boolean; permissionCheck: boolean }> {
	const layerFiles = files.filter(f => f.filename.toLowerCase().startsWith('test/simulation/cache/layers/'));

	if (layerFiles.length === 0) {
		console.log('✅ Pull request does not contain any layer files.');
		return { statusCheck: true, permissionCheck: true };
	}

	const pullRequestCommits = await getPullRequestCommits(repository, pullRequestNumber);
	const commitsWithDetails = await Promise.all(pullRequestCommits.map(sha => getCommit(repository, sha)));

	let statusCheckResult = true, permissionCheckResult = true;
	const permissions = new Map<string, string>();
	console.log(`🔍 Pull request contains ${layerFiles.length} layer files. Checking status and author...`);

	for (const file of layerFiles) {
		const statusCheck = file.status === 'added' || file.status === 'removed';
		console.log(`   - 🗄️ ${file.filename}`);
		console.log(`     - Status: ${file.status} ${statusCheck ? '✅' : '⛔'}`);

		if (!statusCheck) {
			statusCheckResult = false;
		}

		// List of commits that contain the file
		const commits = commitsWithDetails.filter(c =>
			c.files.some(f => f.filename === file.filename));

		console.log(`     - Commit(s):`);
		for (const commit of commits) {
			let permission = permissions.get(commit.committer.login);
			if (!permission) {
				permission = await getRepositoryPermission(repository, commit.committer.login);
				permissions.set(commit.committer.login, permission);
			}

			const permissionCheck = allowedCacheLayerPermissions.has(permission);
			console.log(`       - ${commit.sha} by ${commit.committer.login}. Repository permission: ${permission} ${permissionCheck ? '✅' : '⛔'}`);

			if (!permissionCheck) {
				permissionCheckResult = false;
			}
		}
	}

	return { statusCheck: statusCheckResult, permissionCheck: permissionCheckResult };
}

async function main() {
	try {
		const repository = process.env['REPOSITORY'];
		const pullRequestNumber = process.env['PULL_REQUEST'];

		if (!repository || !pullRequestNumber) {
			throw new Error('Missing required environment variables: REPOSITORY or PULL_REQUEST');
		}

		console.log(`🔍 Checking pull request #${pullRequestNumber} in repository "${repository}"...`);

		// Get a list of files in the pull request
		const files = await getPullRequestFiles(repository, pullRequestNumber);

		// 1. Check base file status
		const baseCheckResult = await checkDatabaseFile(files);

		// 2. Check cache layer file(s) status and author
		const layerCheckResult = await checkDatabaseLayerFiles(repository, pullRequestNumber, files);

		if (!baseCheckResult) {
			throw new Error('Base file can only be modified in a pull request.');
		}
		if (!layerCheckResult.statusCheck) {
			throw new Error('Cache layer files can only be added or deleted, never modified');
		}
		if (!layerCheckResult.permissionCheck) {
			throw new Error('Cache layer files can only be added by repository maintainers or collaborators with write access');
		}
	} catch (error) {
		console.log('::error::⛔', error);
		process.exit(1);
	}
}

if (require.main === module) {
	main();
}
