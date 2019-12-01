import { NowRequest, NowResponse } from '@now/node';
import { GraphQLClient } from 'graphql-request';

const getLinkQuery = `
query getLink($id: String) {
  sneaky_url(where: {id: {_eq: $id}}) {
    target_url
  }
}
`;

const handler = (req: NowRequest, res: NowResponse) => {
  const linkID = req.url.split('/')[1]; // This should be the ID
  const queryVariables = {
    id: linkID
  };
  const graphQLClient = new GraphQLClient(process.env.graphql_endpoint, {
    headers: {
      ['x-hasura-admin-secret']: process.env.graphql_key
    }
  });
  if (linkID !== undefined) {
    graphQLClient.request(getLinkQuery, queryVariables).then(data => {
      const { target_url } = data.sneaky_url[0];
      if (target_url) {
        res.writeHead(301, { Location: target_url });
        return res.end();
      }
      return res.status(500).json({ error: 'Internal Server Error' });
    });
  }
  return res.status(400).json({ error: 'Requires an ID for the link' });
};

module.exports = handler;
