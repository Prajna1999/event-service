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
import { Resend } from 'resend'

interface Event {
	name: string;
	link: string;
	description: string;
	date_human_readable: string;
}

async function fetchEvents(env: Env, start: number = 0): Promise<Event[]> {
	const options = {
		method: 'GET',
		url: env.RAPID_API_URL,
		params: {
			query: 'Concerts in Delhi',
			date: 'any',
			is_virtual: 'false',
			start: start.toString()
		},
		headers: {
			'x-rapidapi-key': env.RAPID_API_KEY,
			'x-rapidapi-host': 'real-time-events-search.p.rapidapi.com'
		}
	};
	const response = await axios.request(options)
	return response.data.data
}

async function fetchTop20Events(env: Env): Promise<Event[]> {
	const allEvents = []
	for (let i = 0; i < 2; i++) {
		const events = await fetchEvents(env, i * 10);
		allEvents.push(...events)

		if (events.length < 10) break
	}
	return allEvents.slice(0, 20)
}
function generateEmailHTML(events: Event[]): string {
	const eventItems = events.map(event => `
        <div style="margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid #e5e7eb;">
            <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827;">
                <a href="${event.link}" style="color: #2563eb; text-decoration: none;">${event.name}</a>
            </h2>
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">${event.date_human_readable}</p>
            <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #374151;">${event.description}</p>
        </div>
    `).join('');

	return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <h1 style="margin: 0 0 32px 0; font-size: 24px; font-weight: 700; color: #111827;">
                    Heritage Walks in New Delhi
                </h1>
                ${eventItems}
            </div>
        </body>
        </html>
    `;
}

async function sendEmail(env: Env, events: Event[]) {
	const emailServer = new Resend(env.RESEND_SMTP_API_KEY)
	emailServer.emails.send({
		from: 'onboarding@resend.dev',
		to: ['gituprajna20@gmail.com', 'mohdajmalbaig@gmail.com', 'prajnaprayas1@gmail.com'],
		subject: `Upcoming Concerts in Delhi-NCR- ${new Date().toLocaleDateString()}`,
		html: generateEmailHTML(events)
	})
}
export default {

	async fetch(req, env, ctx) {


		try {
			const eventsData = await fetchTop20Events(env)


			await sendEmail(env, eventsData)

			return new Response(JSON.stringify({ count: eventsData.length, eventsData }), {
				headers: { 'Content-Type': 'application/json' }
			});
		} catch (e) {
			console.error(e)
			return new Response('Error fetching event', { status: 500 })
		}
	},
	// The scheduled handler is invoked at the interval set in our wrangler.jsonc's
	// [[triggers]] configuration.
	async scheduled(event, env, ctx): Promise<void> {

		try {
			const eventsData = await fetchTop20Events(env)
			await sendEmail(env, eventsData)
			console.log(`Cron fired at ${event.cron}:success`);

		} catch (e) {
			console.error(`Error:`, e)
			console.log(`Cron fired at ${event.cron}: fail`)
		}
	},
} satisfies ExportedHandler<Env>;
