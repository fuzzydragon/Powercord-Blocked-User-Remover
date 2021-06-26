const { Plugin } = require(`powercord/entities`)
const { getModule } = require(`powercord/webpack`)
const { inject, uninject } = require(`powercord/injector`)

class Pest extends Plugin {
	async startPlugin() {
		this.removePest()	
	}

	pluginWillUnload() {
		uninject(`pest-voice`)
		uninject(`pest-list`)
		uninject(`pest-message`)
	}

	async removePest() {
		const { isBlocked } = await getModule([`isBlocked`])

		// VOICE CHANNEL LIST
		const voiceUser = await getModule(m => m.default?.displayName === `VoiceUser`)

		inject(`pest-voice`, voiceUser, `VoiceUserList`, (args, resp) => {
			args[0].children[0] = args[0].children[0].filter(e => !isBlocked(e.props.user.id))

			return resp
		})

		voiceUser.default.displayName = `VoiceUser`

		// SERVER CHANNEL LIST

		const memberListItem = await getModule(m => m.displayName === `MemberListItem`)

		inject(`pest-list`, memberListItem.prototype, `render`, function(args, resp) {
			// console.log(`PEST`, args, resp)

			const user = this.props?.user

			if (user && isBlocked(user.id)) {
				return null
			}

			return resp
		})

		// MESSAGES
		
		const message = await getModule(m => m.default?.displayName === `Message`)

		inject(`pest-message`, message, `default`, (args, resp) => {
			const props = args[0]?.childrenMessageContent?.props

			if (props != null) {
				if (props.className?.includes(`blocked`)) { 
					return null
				}
 
				const mentions = props.message?.mentions

				if (mentions != null && mentions.length > 0) {
					props.message.mentions = mentions.filter(mention => !isBlocked(mention))
					mentions.every(mention => props.message.content = props.message.content.replace(`<@!${mention}>`, ``))
				}
				
				// if (mentions != null && mentions.length > 0) {
				// 	for (const mention of mentions) {
				// 		if (isBlocked(mention)) {
				// 			return null
				// 		}
				// 	}
				// }
			}

			// if (args[0]?.childrenMessageContent?.props?.className?.includes(`blocked`)) {
			// 	return null
			// }

			return resp
		})

		message.default.displayName = `Message` 

	}
}

module.exports = Pest
