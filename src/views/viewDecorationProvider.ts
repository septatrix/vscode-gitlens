'use strict';
import {
	CancellationToken,
	Disposable,
	Event,
	EventEmitter,
	FileDecoration,
	FileDecorationProvider,
	ThemeColor,
	Uri,
	window,
} from 'vscode';
import { GlyphChars } from '../constants';
import { Container } from '../container';
import { GitFile } from '../git/git';

export class ViewFileDecorationProvider implements FileDecorationProvider, Disposable {
	private readonly _onDidChange = new EventEmitter<undefined | Uri | Uri[]>();
	get onDidChange(): Event<undefined | Uri | Uri[]> {
		return this._onDidChange.event;
	}

	private readonly disposable: Disposable;
	constructor() {
		this.disposable = Disposable.from(window.registerFileDecorationProvider(this));
	}

	dispose(): void {
		this.disposable.dispose();
	}

	async provideFileDecoration(uri: Uri, _token: CancellationToken): Promise<FileDecoration | undefined> {
		if (uri.scheme !== 'gitlens-view') return undefined;

		switch (uri.authority) {
			case 'commit-file': {
				// const [ref, name] = uri.path.substr(1).split('/', 1);
				// console.log(ref, name);

				const info: { repoPath: string; file: GitFile } = JSON.parse(uri.query);

				switch (info.file.status) {
					case '!':
						return {
							badge: 'I',
							color: new ThemeColor('gitDecoration.ignoredResourceForeground'),
							tooltip: 'Ignored',
						};
					case '?':
						return {
							badge: 'U',
							color: new ThemeColor('gitDecoration.untrackedResourceForeground'),
							tooltip: 'Untracked',
						};
					case 'A':
						return {
							badge: 'A',
							color: new ThemeColor('gitDecoration.addedResourceForeground'),
							tooltip: 'Added',
						};
					case 'C':
						return {
							badge: 'C',
							color: new ThemeColor('gitlens.decorations.copiedForegroundColor'),
							tooltip: 'Copied',
						};
					case 'D':
						return {
							badge: 'D',
							color: new ThemeColor('gitDecoration.deletedResourceForeground'),
							tooltip: 'Deleted',
						};
					case 'M':
						// case 'U':
						return {
							badge: 'M',
							// color: new ThemeColor('gitDecoration.modifiedResourceForeground'),
							// tooltip: 'Modified',
						};
					case 'R':
						return {
							badge: 'R',
							color: new ThemeColor('gitlens.decorations.renamedForegroundColor'),
							tooltip: 'Renamed',
						};
					// case 'T':
					// case 'X':
					// case 'B':
					default:
						return undefined;
				}
			}
			case 'branch':
				{
					const name = uri.path.substr(1);

					const info = JSON.parse(uri.query);
					if (info.repoPath == null) return undefined;

					const [[branch], remotes] = await Promise.all([
						Container.git.getBranches(info.repoPath, { filter: b => b.name === name }),
						Container.git.getRemotes(info.repoPath),
					]);

					if (branch == null) return undefined;

					if (branch.tracking) {
						if (branch.state.ahead && branch.state.behind) {
							return {
								badge: `${branch.current ? '✔' : ''}${GlyphChars.ArrowDownUp}`,
								color: new ThemeColor('gitlens.decorations.branchAheadAndBehindForegroundColor'),
								tooltip: 'Ahead & Behind',
							};
						}
						if (branch.state.ahead) {
							return {
								badge: `${branch.current ? '✔' : ''}${GlyphChars.ArrowUp}`,
								color: new ThemeColor('gitlens.decorations.branchAheadForegroundColor'),
								tooltip: 'Ahead',
							};
						}
						if (branch.state.behind) {
							return {
								badge: `${branch.current ? '✔' : ''}${GlyphChars.ArrowDown}`,
								color: new ThemeColor('gitlens.decorations.branchBehindForegroundColor'),
								tooltip: 'Behind',
							};
						}

						return {
							badge: branch.current ? '✔' : '',
							color: new ThemeColor('gitlens.decorations.branchUpToDateForegroundColor'),
							tooltip: 'Up to Date',
						};
					} else if (remotes.length > 0) {
						return {
							badge: `${branch.current ? '✔' : ''}${GlyphChars.ArrowUp}`,
							color: new ThemeColor('gitlens.decorations.branchUnpublishedForegroundColor'),
							tooltip: 'Unpublished',
						};
					}

					if (branch.current) {
						return {
							badge: '✔',
							tooltip: 'Current Branch',
						};
					}
				}

				break;
		}

		return undefined;
	}
}
