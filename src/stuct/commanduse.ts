import * as Discord from 'discord.js';
import {canUse as canUsePermission} from '../handlers/permissions';
import {
	CommandUsage,
	CanUse,
	CommandResponseOptions,
	CustomClient,
	CommandUseType,
	CommandHelp,
} from '../types';
import {Command} from './command';
import {ButtonMenu} from '.';

export abstract class CommandUse<Args> {
	abstract type: CommandUseType;
	public args: Args;
	public dbUser: any; // REPLACE

	public author: Discord.User | Discord.PartialUser;
	public member: Discord.GuildMember;
	public client: CustomClient;
	public guild: Discord.Guild;
	public channel:
		| Discord.TextChannel
		| Discord.NewsChannel
		| Discord.ThreadChannel
		| Discord.DMChannel;

	public command: Command;

	protected typingInterval: NodeJS.Timeout;

	public message?: Discord.Message | null;
	public interaction?: Discord.CommandInteraction | null;
	public content?: string | null;
	public output: Discord.Message | null;

	/**
	 * Create a use of a command
	 * @param {CommandUsage} usage The details of the use
	 */
	constructor({
		command,
		dbUser,
		author,
		member,
		client,
		guild,
		channel,
		args,
	}: CommandUsage<Args>) {
		this.command = command;
		this.author = author;
		this.member = member || null;
		this.client = client;
		this.guild = guild;
		this.channel = channel;
		this.dbUser = dbUser;
		this.args = args;
	}

	/**
	 * Get a full user object from a potentially partial user object
	 * @async
	 * @returns {Promise<Discord.User | null>} The full user object
	 */
	public async getFullAuthor(): Promise<Discord.User | null> {
		let fetchedUser: Discord.User | null;
		if (this.author.partial) {
			fetchedUser = await this.client.users
				.fetch(this.author.id)
				.catch(() => null);
		} else {
			fetchedUser = this.author as Discord.User;
		}
		return fetchedUser || null;
	}

	/**
	 * Whether or not this command can be used
	 * @async
	 * @param {string} [content] The message content
	 * @returns {CanUse} If the command can be used
	 */
	public async canUse(content?: string): Promise<CanUse> {
		const member = await this.guild.members
			.fetch(this.author.id)
			.catch(e => null);

		if (this.dbUser.blocked && !this.dbUser.developer)
			return {
				canUse: false,
				responseMessage: {
					content: 'You are banned from using the bot.',
				},
			};

		if (!member)
			return {
				canUse: false,
				responseMessage: {
					content: 'An error occurred, please try again.',
				},
			};

		if (
			this.command.config.flags.includes('dev') &&
			!this.dbUser.developer
		) {
			return {
				canUse: false,
				responseMessage: {
					content: `This command can only be used by developers.`,
				},
			};
		}
		if (
			this.command.config.flags.includes('admin') &&
			(!member || !member.permissions.has('MANAGE_GUILD'))
		)
			return {
				canUse: false,
				responseMessage: {
					content:
						'This command requires the manage server permission to run.',
				},
			};

		const cooldown = this.command.getCooldown(this.author.id);
		if (cooldown !== 0) {
			return {
				canUse: false,
				responseMessage: {
					embeds: [
						new Discord.MessageEmbed()
							.setTitle('You are on cooldown')
							.setColor(0xff0000)
							.setDescription(
								`Try again in ${cooldown} seconds.`,
							),
					],
				},
			};
		}

		this.setCooldown(2000);

		return {
			canUse: true,
			responseMessage: null,
		};
	}

	/**
	 * Send a Discord message object
	 * @param {Discord.MessageOptions} payload Message payload to send
	 * @param {CommandResponseOptions} [options] Response options to be parsed
	 */
	abstract sendMessage(
		payload: Discord.MessageOptions,
		options?: CommandResponseOptions,
	): Promise<Discord.Message>;

	/**
	 * Send an embed
	 * @param {Discord.MessageEmbed} payload The embed to send
	 * @param {CommandResponseOptions} [options] Response options to be parsed
	 * @param {Discord.MessageOptions | Discord.InteractionReplyOptions} [rawOptions] Raw message options to send
	 */
	abstract sendEmbed(
		embed: Discord.MessageEmbed,
		options?: CommandResponseOptions,
		rawOptions?: Discord.MessageOptions | Discord.InteractionReplyOptions,
	): Promise<Discord.Message>;

	/**
	 * Send a plain text message
	 * @param {string} content Message content to send
	 * @param {CommandResponseOptions} [options] Response options to be parsed
	 * @param {Discord.MessageOptions | Discord.InteractionReplyOptions} [rawOptions] Raw message options to send
	 */
	abstract sendText(
		content: string,
		options?: CommandResponseOptions,
		rawOptions?: Discord.MessageOptions | Discord.InteractionReplyOptions,
	): Promise<Discord.Message>;

	/**
	 * Start typing in the channel
	 * @async
	 */
	public async startTyping(): Promise<void> {
		throw new Error('Not implemented');
	}

	/**
	 * Stop typing in the channel
	 * @async
	 */
	public async stopTyping(): Promise<void> {
		throw new Error('Not implemented');
	}

	/**
	 * Send a help menu for this command
	 * @async
	 */
	public async sendHelp(): Promise<void> {
		await this.sendMessage(this.generateCommandEmbed(), {
			saveOutput: true,
		});
		if (!this.output) return;

		const menu = new ButtonMenu(this.output, this.author.id, this.message, {
			idle: 1000 * 60 * 5,
		});

		menu.on('collect', async (interaction: Discord.Interaction) => {
			if (interaction.isButton()) {
				if (interaction.customId.startsWith('command-')) {
					const cmd = interaction.customId.slice(8);
					this.editHelp(cmd, interaction);
				}
			}
			if (interaction.isSelectMenu()) {
				if (interaction.customId == 'command') {
					const cmd = interaction.values[0];
					this.editHelp(cmd.replace(/ /g, '.'), interaction);
				}
			}
		});
	}

	/**
	 * Edit the help menu on interaction use
	 * @async
	 * @param {string} cmd The command to show in the help menu
	 * @param {Discord.SelectMenuInteraction | Discord.ButtonInteraction} interaction The interaction to respond to
	 */
	private async editHelp(
		cmd: string,
		interaction: Discord.SelectMenuInteraction | Discord.ButtonInteraction,
	): Promise<void> {
		const cmdfile = this.client.commands.get(cmd);
		if (!cmdfile)
			return await interaction
				.reply({content: 'Command not found.', ephemeral: true})
				.catch(() => null);
		const output = this.generateCommandEmbed(cmdfile.help);
		if (!output)
			return await interaction
				.reply({content: 'Command not found.', ephemeral: true})
				.catch(() => null);

		await this.sendMessage(output, {
			editOutput: true,
			saveOutput: true,
		});
		return interaction.deferUpdate().catch(() => null);
	}

	/**
	 * Generate an embed for command help
	 * @param {CommandHelp} help The command help object
	 * @param {boolean} [inMenu=false] Whether the help is being sent in a menu
	 */
	public generateCommandEmbed(
		cmdhelp: CommandHelp = this.command.help,
		inMenu: boolean = false,
	): Discord.MessageOptions {
		const slashCommand = this.type == 'SLASH';
		const prefix = slashCommand ? '/' : this.dbServer.prefix;

		const commandname = cmdhelp.name.replace(/\./g, ' ');

		const title = [
			`${prefix}${commandname}`,
			`${cmdhelp.args
				.map(arg => (arg.required ? `<${arg.name}>` : `[${arg.name}]`))
				.join(' ')}`,
		].join(' ');
		const description = cmdhelp.description;
		let fields: Discord.EmbedFieldData[] = [];

		if (!slashCommand)
			fields.push({
				name: 'ALIASES',
				value:
					cmdhelp.aliases.length > 0
						? cmdhelp.aliases.map(x => `\`${x}\``).join(', ')
						: 'none',
				inline: true,
			});

		if (cmdhelp.protip !== '')
			fields.push({name: 'PRO TIP', value: cmdhelp.protip, inline: true});
		if (cmdhelp.examples.length > 0)
			fields.push({
				name: 'EXAMPLES',
				value: cmdhelp.examples.join('\n'),
				inline: true,
			});
		let components: Discord.MessageActionRow[] = [];
		if (cmdhelp.subcommands)
			components.push(
				new Discord.MessageActionRow().addComponents([
					new Discord.MessageSelectMenu({
						customId: 'command',
						placeholder: 'Select a subcommand',
						options: cmdhelp.subcommands.map((cmd: string) => ({
							label: `${prefix}${commandname} ${cmd}`,
							value: `${commandname}.${cmd}`,
						})),
					}),
				]),
			);
		if (cmdhelp.name.includes('.')) {
			const maincmd = cmdhelp.name.split('.').slice(0, -1).join('.');
			components.push(
				new Discord.MessageActionRow().addComponents([
					new Discord.MessageButton({
						style: 'PRIMARY',
						emoji: '⏪',
						label: 'Back',
						customId: `command-${maincmd}`,
					}),
				]),
			);
		} else if (inMenu) {
			components.push(
				new Discord.MessageActionRow().addComponents([
					new Discord.MessageButton({
						style: 'PRIMARY',
						emoji: '⏪',
						label: 'Back',
						customId: `back`,
					}),
				]),
			);
		}

		return {
			embeds: [
				new Discord.MessageEmbed()
					.setColor(0xff0000)
					.setTitle(title)
					.setDescription(description)
					.addFields(fields),
			],
			components,
		};
	}

	/**
	 * Set a cooldown on the user
	 * @param {number} [cooldown=Cooldown in command config] The cooldown in milliseconds
	 */
	public setCooldown(cooldown: number = this.command.config.cooldown) {
		this.command.setCooldown(this.author.id, cooldown);
	}
}
