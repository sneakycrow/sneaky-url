import { NowRequest, NowResponse } from '@now/node';
import shortid from 'shortid';
import { GraphQLClient } from 'graphql-request';

const newLinkMutation = `
mutation newLinkMutation($id: String, $urlTarget: String) {
  insert_sneaky_url(objects: {id: $id, target_url: $urlTarget}) {
    affected_rows
    returning {
      id
    }
  }
}
`;

const handler = (req: NowRequest, res: NowResponse) => {
  if (req.headers['x-sneaky-key'] && req.headers['x-sneaky-key'] === process.env.sneaky_key) {
    if (req.body) {
      const { urlTarget } = req.body;
      const id = shortid.generate();
      if (urlTarget && id) {
        const variables = {
          id,
          urlTarget
        };

        const graphQLClient = new GraphQLClient(process.env.graphql_endpoint, {
          headers: {
            ['x-hasura-admin-secret']: process.env.graphql_key
          }
        });

        return graphQLClient.request(newLinkMutation, variables).then(data => {
          const { affected_rows, returning } = data.insert_sneaky_url;
          const baseURL = 'https://sneakycrow.dev';
          if (affected_rows > 0) {
            return res
              .status(200)
              .json({ status: 'success', newUrl: `${baseURL}/${returning[0].id}` });
          }
          return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        });
      }
    }
    return res.status(400).json({ error: 'This endpoint requires a url target' });
  }
  res.status(401).json({ error: 'Unauthorized Access' });
};

module.exports = handler;
