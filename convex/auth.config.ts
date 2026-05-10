export default {
	providers: [
		{
			type: 'oidc',
			domain: 'https://aveid.net',
			applicationID: process.env.AVE_CLIENT_ID
		}
	]
};
