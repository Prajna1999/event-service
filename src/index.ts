/**
 * Welcome to Cloudflare Workers!
 *
 * This is a template for a Scheduled Worker: a Worker that can run on a
 * configurable interval:
 * https://developers.cloudflare.com/workers/platform/triggers/cron-triggers/
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Run `curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"` to see your Worker in action
 * - Run `npm run deploy` to publish your Worker
 *
 * Bind resources to your Worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import axios from "axios";
async function sendEmail(data: any) {
	const options = {
		method: 'POST',
		url: 'https://api.mailchannels.net/tx/v1/send',
		body: JSON.stringify({
			personalizations: [{
				to: [{ email: 'gituprajna20@gmail.com' }],
			}],
			from: { email: 'gituprajna20@gmail.com' },
			subject: `Concert Events - ${new Date().toLocaleDateString()}`,
			content: [{
				type: 'text/plain',
				value: JSON.stringify(data, null, 2)
			}],
		}),

	}
}

export default {

	async fetch(req, env, ctx) {
		const options = {
			method: 'GET',
			url: env.RAPID_API_URL,
			params: {
				query: 'Heritage Walks in New Delhi',
				date: 'any',
				is_virtual: 'false',
				start: '0'
			},
			headers: {
				'x-rapidapi-key': env.RAPID_API_KEY,
				'x-rapidapi-host': 'real-time-events-search.p.rapidapi.com'
			}
		};

		try {
			const response = await axios.request(options)
			return new Response(JSON.stringify(response.data), {
				headers: { 'Content-Type': 'application/json' }
			});
		} catch (e) {
			console.error(e)
			return new Response('Error fetching event', { status: 500 })
		}
	},
	// The scheduled handler is invoked at the interval set in our wrangler.jsonc's
	// [[triggers]] configuration.
	async scheduled(event, env, ctx): Promise<Any> {
		const options = {
			method: 'GET',
			url: env.RAPID_API_URL,
			params: {
				query: 'Heritage Walks in New Delhi',
				date: 'any',
				is_virtual: 'false',
				start: '0'
			},
			headers: {
				'x-rapidapi-key': env.RAPID_API_KEY,
				'x-rapidapi-host': 'real-time-events-search.p.rapidapi.com'
			}
		};
		try {
			const response = await axios.request(options)
			console.log(`Cron fired at ${event.cron}:success`);
			return new Response(JSON.stringify(response.data), {
				headers: { 'Content-Type': 'application/json' }
			})

			// await sendEmail(data)

		} catch (e) {
			console.error(`Error:`, e)
			console.log(`Cron fired at ${event.cron}: fail`)
		}
	},
} satisfies ExportedHandler<Env>;
