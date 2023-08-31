import React, { useRef, useState } from 'react';

// import tRPC client Module
import {
  type TRPCUntypedClient,
  createTRPCProxyClient,
  httpBatchLink,
  createWSClient,
  wsLink,
  splitLink,
} from '@trpc/client';
import SendRequestButton from '../sharedComponents/requestButtons/SendRequestButton';
import TextCodeArea from '../sharedComponents/TextCodeArea';

type Props = {
  onClose: () => void;
};

const h3Styles = {
  display: 'block',
  fontSize: '1.17em',
  fontWeight: 'bold',
};

/**
 * @todo 2023-08-31 - This component needs a mutable container for storing any
 * unsubscribe functions generated by the tRPC client.
 *
 * But because the client is so jacked up, there's no way to get the exact type
 * easily. I had to make a hack by shoving an "any" into the type parameter for
 * tRPC's untyped client class instance type.
 *
 * Very bad, very evil, very cursed. If the client ever gets fixed up, this type
 * should be cleaned up, too.
 */
type UnsubFixMe = ReturnType<TRPCUntypedClient<any>['subscription']>;

export default function TRPCSubscriptionContainer({ onClose }: Props) {
  /**
   * @todo 2023-08-31 - I have no idea what the type of endPoint is supposed to
   * be. It's defined here as a string, but because the tRPC client is jacked
   * up, when you use the endpoint to index the client value, TypeScript thinks
   * endpoint should be a number.
   *
   * Impossible to know the intended type without fixing the router setup first.
   * Fix this type when convenient.
   */
  const [endPoint, setEndpoint] = useState('');
  const [url, setUrl] = useState('');
  const [responseBody, setResponseBody] = useState('');
  const [subscriptionStarted, setsubscriptionStarted] = useState(false);

  const trpcUnsubscribeRef = useRef<UnsubFixMe | null>(null);

  const startSubscription = () => {
    setsubscriptionStarted(true);

    try {
      const wsClient = createWSClient({ url });

      const client = createTRPCProxyClient({
        links: [
          splitLink({
            condition: (op) => {
              return op.type === 'subscription';
            },
            true: wsLink({
              client: wsClient,
            }),
            false: httpBatchLink({
              url: 'http://localhost:3000/trpc',
            }),
          }),
        ],
      });

      trpcUnsubscribeRef.current = client[endPoint].subscribe(undefined, {
        onData: (message) => {
          setResponseBody((pre) => {
            if (pre === 'subscription started') {
              return `${new Date()}\n${message}`;
            } else {
              return `${pre}\n\n${new Date()}\n${message}`;
            }
          });
        },
      });

      setResponseBody(`Subscription at ${endpoint} started`);
    } catch (e) {
      setResponseBody(JSON.stringify(e));
    }
  };

  const endSubscription = () => {
    setsubscriptionStarted(false);
    if (trpcUnsubscribeRef.current !== null) {
      trpcUnsubscribeRef.current.unsubscribe();
      trpcUnsubscribeRef.current = null;
    }
  };

  return (
    <div>
      <h3 style={h3Styles}>Your subscription</h3>
      <div
        className="is-flex is-justify-content-center"
        style={{ padding: '10px' }}
      >
        <div id="tRPCButton" className="no-border-please button is-webrtc">
          <span>Subscription</span>
        </div>
        <input
          className="ml-1 input input-is-medium is-info"
          type="text"
          placeholder="Enter your WS url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <div className="is-flex is-justify-content-center is-align-items-center ml-4">
          <div className="delete m-auto" onClick={onClose} />
        </div>
      </div>
      <input
        className="ml-1 input input-is-medium is-info"
        type="text"
        placeholder="Endpoint"
        value={endPoint}
        onChange={(e) => setEndpoint(e.target.value)}
      />
      {subscriptionStarted && (
        <div>
          Log will appear down here
          <TextCodeArea
            value={responseBody}
            mode="application/json"
            readOnly={true}
          />
        </div>
      )}

      {!subscriptionStarted ? (
        <SendRequestButton
          onClick={startSubscription}
          buttonText="Start Subscription"
        />
      ) : (
        <SendRequestButton
          onClick={endSubscription}
          buttonText="Stop Subscription"
        />
      )}
    </div>
  );
}

