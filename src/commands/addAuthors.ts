'use strict';
import { SourceControl } from 'vscode';
import { command, Command, Commands } from './common';
import { executeGitCommand } from './gitCommands';
import { Container } from '../container';

@command()
export class AddAuthorsCommand extends Command {
	constructor() {
		super(Commands.AddAuthors);
	}

	async execute(sourceControl: SourceControl) {
		let repo;
		if (sourceControl?.rootUri != null) {
			repo = await Container.git.getRepository(sourceControl.rootUri);
		}

		return executeGitCommand({
			command: 'co-authors',
			state: { repo: repo, contributors: undefined },
		});
	}
}
