/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	BOT_TOKEN: string
	MISSU_WEBHOOK_SECRET_PATH: string
	TENGXING_ID: string
}


export default {

	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {

		// global variables
		const bot = `https://api.telegram.org/bot${env.BOT_TOKEN}/`
		const secretPath = env.MISSU_WEBHOOK_SECRET_PATH
		const tengxingId = Number(env.TENGXING_ID)

		// handle request
		const { method, headers } = request;
		const url = new URL(request.url);

		// telegram webhook api request
		if (method === 'POST' && url.pathname === secretPath && headers.get('content-type') === 'application/json') {

			// handle telegram message
			const update: any = await request.json();
			const { message } = update
			const chatId = message.chat.id

			if (message && message.text) {
				const text = message.text.trim().toLowerCase()

				const res = await sendMessage(chatId, `Hello, ${message.from.first_name} ${text}`)
				const res2 = await sendMessage(tengxingId, JSON.stringify(res))
				return new Response(JSON.stringify(res), { status: 200 });
			}
		}

		// send text message
		async function sendMessage(chatId: number | string, message: string | null) {
			const method = 'sendMessage'
			const parameter = String([`chat_id=${chatId}`, `text=${message}`].join("&"))
			const res = await fetch(`${bot}${method}?${parameter}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
			})
			return res.json();
		}

		// set or delete webhook
		if (method === 'GET' && url.pathname === '/tengx-setwebhook') {

			const webhookUrl = (url.searchParams.get('delete') === 'true') ? '' : secretPath
			const res = await fetch(`${bot}setWebhook?url=${url.origin}${webhookUrl}`)

			return new Response(JSON.stringify(await res.json()), { status: 200 });
		}

		// get webhook info
		if (method === 'GET' && url.pathname === '/tengx-getwebhookinfo') {
			const res = await fetch(`${bot}getWebhookInfo`)
			return new Response(JSON.stringify(await res.json()), { status: 200 });
		}

		// request is not from telegram
		if (headers.get('content-type') !== 'application/json') return new Response('Hello World!', { status: 200 });

		// Report message
		// failed all if statement above, sent debug message to tengxing
		const update = await request.json();
		const boom = `💣💣💣 Boooom.... 
Something is going wrong! 🤯🤯\n\n
Debug Update object:
${JSON.stringify(update)}
		
URL object:
- method: ${method}
- is secretPath: ${url.pathname === secretPath}
- pathname: ${(url.pathname === secretPath) ? 'no problem' : url.pathname}
- content-type: ${headers.get('content-type')}`

		const res: any = await sendMessage(tengxingId, boom)
		return new Response(JSON.stringify(res), { status: 200 });
	},
};
