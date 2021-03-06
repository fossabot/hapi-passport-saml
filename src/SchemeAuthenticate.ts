const Boom = require('boom');
import { SchemeConfig } from './SchemeConfig';
import { HapiSaml } from './HapiSaml';
import { Request } from 'hapi';
export const SchemeAuthenticate = (
  saml: HapiSaml,
  settings: SchemeConfig,
  samlCredsPropKey: string
) => (request: Request, reply: any) => {
  const state = request.state;
  let session = state[settings.cookie];

  if (!session) {
    saml.getSamlLib().getAuthorizeUrl(
      {
        headers: request.headers,
        body: request.payload,
        query: request.query
      },
      function(err: any, loginUrl: string) {
        console.log(err);
        if (err !== null) {
          return reply().code(500);
        }
        session = {};
        session.redirectTo = request.path;

        return reply.redirect(loginUrl).state(settings.cookie, session);
      }
    );
    return;
  }

  if (session && session[samlCredsPropKey]) {
    return reply.continue({
      credentials: session[samlCredsPropKey]
    });
  }
  if (request.auth.mode === 'try') {
    return reply(null, Boom.unauthorized('Not authenticated'));
  }

  const err = { error: 'Unauthorized' };
  return reply(err, 'saml');
};
