'use strict';

import { Apiendpoint } from './apiendpoint';
import { stackAnalysisServices } from './stackAnalysisService';
import { GlobalState } from './constants';
import * as fetch from 'node-fetch'

export module authextension {
  export let setContextData: any;
  export let setUUID: any;

  setContextData = (context_f8_access_routes, context_f8_3scale_user_key) => {
    Apiendpoint.STACK_API_URL = context_f8_access_routes.prod + '/api/v2/';
    Apiendpoint.STACK_API_USER_KEY = context_f8_3scale_user_key;
    Apiendpoint.OSIO_ROUTE_URL = context_f8_access_routes.prod;
    process.env['RECOMMENDER_API_URL'] =
      context_f8_access_routes.prod + '/api/v2';
    process.env['THREE_SCALE_USER_TOKEN'] = context_f8_3scale_user_key;
  };

  setUUID = (uuid) => {
    process.env['UUID'] = uuid;
  };

  export const authorize_f8_analytics = async context => {
    try {
      let context_f8_access_routes = context.globalState.get(
        'f8_access_routes'
      );
      let context_f8_3scale_user_key = context.globalState.get(
        'f8_3scale_user_key'
      );

      if (context_f8_access_routes && context_f8_3scale_user_key) {
        setContextData(context_f8_access_routes, context_f8_3scale_user_key);
      } else {
        let respData = await get_3scale_routes(context);
        if (!respData) {
          return false;
        }
      }

      let uuid = context.globalState.get(GlobalState.UUID);

      if (uuid && uuid != '') {
        setUUID(uuid);
      } else {
        uuid = await getUUID(context);
        if (uuid) {
          context.globalState.update(GlobalState.UUID, uuid);
          setUUID(uuid);
        } else {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  export const getUUID = async context => {
    const url = `${
      Apiendpoint.OSIO_ROUTE_URL
      }/user?user_key=${Apiendpoint.STACK_API_USER_KEY}`;

    const response = await fetch(url, { method: 'POST' });
    if (response.ok) {
      let respData = await response.json();
      return respData['user_id'];
    } else {
      throw (`${url} : ` + response.status);
    }
  }

  export const get_3scale_routes = context => {
    return new Promise((resolve, reject) => {
      let options = {};
      options['uri'] = `${
        Apiendpoint.THREE_SCALE_CONNECT_URL
        }get-endpoints?user_key=${Apiendpoint.THREE_SCALE_CONNECT_KEY}`;
      options['headers'] = { 'Content-Type': 'application/json' };

      stackAnalysisServices
        .get3ScaleRouteService(options)
        .then(respData => {
          let resp = respData;
          if (resp && resp['endpoints']) {
            context.globalState.update('f8_access_routes', resp['endpoints']);
            context.globalState.update('f8_3scale_user_key', resp['user_key']);
            let context_f8_access_routes = context.globalState.get(
              'f8_access_routes'
            );
            let context_f8_3scale_user_key = context.globalState.get(
              'f8_3scale_user_key'
            );
            setContextData(
              context_f8_access_routes,
              context_f8_3scale_user_key
            );
            resolve(true);
          }
        })
        .catch(err => {
          reject(null);
        });
    });
  };
}
