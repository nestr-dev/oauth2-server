import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'

export const collections = {
  AccessTokens: undefined,
  RefreshTokens: undefined,
  Clients: undefined,
  AuthCodes: undefined
}

const bind = fn => Meteor.bindEnvironment(fn)

/**
 * @private used by OAuthMeteorModel.prototype.getAccessToken
 */

export const getAccessToken = bind(function (bearerToken) {
  return collections.AccessTokens.findOne({ accessToken: bearerToken })
})

/**
 * @private used by  OAuthMeteorModel.prototype.createClient
 */

export const createClient = bind(function ({ title, homepage, description, privacyLink, redirectUris, grants }) {
  const existingClient = collections.Clients.findOne({ title, redirectUris })
  if (existingClient) {
    return collections.Clients.update(existingClient._id, { $set: { description, privacyLink, redirectUris, grants } })
  }
  const clientId = Random.id(16)
  const secret = Random.id(32)
  const clientDocId = collections.Clients.insert({
    title,
    homepage,
    description,
    privacyLink,
    redirectUris,
    clientId,
    secret,
    grants
  })
  return collections.Clients.findOne(clientDocId)
})

/**
 * @private used by OAuthMeteorModel.prototype.getClient
 */

export const getClient = bind(function (clientId, secret) {
  const clientDoc = collections.Clients.findOne({ clientId, secret })
  return clientDoc || false
})

/**
 * @private used by OAuthMeteorModel.prototype.saveToken
 */

export const saveToken = bind(function (tokenDoc, clientDoc, userDoc) {
  const tokenDocId = collections.AccessTokens.insert({
    accessToken: tokenDoc.accessToken,
    accessTokenExpiresAt: tokenDoc.accessTokenExpiresAt,
    refreshToken: tokenDoc.refreshToken,
    refreshTokenExpiresAt: tokenDoc.refreshTokenExpiresAt,
    scope: tokenDoc.scope,
    client: {
      id: clientDoc.clientId
    },
    user: {
      id: userDoc.id
    }
  })
  return collections.AccessTokens.findOne(tokenDocId)
})

/**
 * @private used by OAuthMeteorModel.prototype.getAuthorizationCode
 */

export const getAuthorizationCode = bind(function (authorizationCode) {
  return collections.AuthCodes.findOne({ authorizationCode })
})

/**
 * @private used by OAuthMeteorModel.prototype.saveAuthorizationCode
 */

export const saveAuthorizationCode = bind(function saveAuthCode (code, client, user) {
  const { authorizationCode } = code
  const { expiresAt } = code
  const { redirectUri } = code
  return collections.AuthCodes.upsert({ authorizationCode }, {
    authorizationCode,
    expiresAt,
    redirectUri,
    client: {
      id: client.client_id
    },
    user: {
      id: user.id
    }
  })
})

/**
 * @private used by OAuthMeteorModel.prototype.revokeAuthorizationCode
 */

export const revokeAuthorizationCode = bind(function revokeAuthorizationCode ({ authorizationCode }) {
  const docCount = collections.AuthCodes.find({ authorizationCode }).count()
  if (docCount === 0) {
    return true
  }
  return collections.AuthCodes.remove({ authorizationCode }) === docCount
})

/**
 * @private used by OAuthMeteorModel.prototype.saveRefreshToken
 */

export const saveRefreshToken = bind(function (token, clientId, expires, user) {
  return collections.RefreshTokens.insert({
    refreshToken: token,
    clientId,
    userId: user.id,
    expires
  })
})

/**
 * @private used by OAuthMeteorModel.prototype.getRefreshToken
 */
export const getRefreshToken = bind(function (refreshToken) {
  return collections.RefreshTokens.findOne({ refreshToken })
})
