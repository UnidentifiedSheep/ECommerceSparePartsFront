import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios, { AxiosError } from 'axios'
import api from '@/services/api/api'
import { gql } from '@apollo/client/core'
import { useAuthStore } from '@/stores/authStore'
import { jwt, deferred, flush, setupBrowser, cleanupBrowser } from '@/services/auth/testSupport'
const mockedFetch = vi.hoisted(() => { const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); return fetch })
import { graphqlClient } from './client'
vi.mock('@/i18n', () => ({ getAcceptLanguage: () => 'en' }))
const query = gql`query AuthTransportTest { viewer { id } }`
const authFailure = () => new Response(JSON.stringify({ errors: [{ message: 'Sign in required', extensions: { code: 'AUTH_NOT_AUTHENTICATED' } }] }), { status: 200, headers: { 'content-type': 'application/json' } })
const success = () => new Response(JSON.stringify({ data: { viewer: { id: 'user-1' } } }), { status: 200, headers: { 'content-type': 'application/json' } })
beforeEach(async () => { vi.stubGlobal('fetch', mockedFetch); setupBrowser(); useAuthStore().login(jwt(), 'first'); mockedFetch.mockReset(); await graphqlClient.clearStore() })
afterEach(cleanupBrowser)
describe('GraphQL auth transport', () => {
  it('refreshes once, including an unchanged access JWT, and retries the operation', async () => {
    mockedFetch.mockResolvedValueOnce(authFailure()).mockResolvedValueOnce(success())
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { token: jwt(), refreshToken: 'second' } })
    expect((await graphqlClient.query({ query, fetchPolicy: 'network-only' })).data.viewer.id).toBe('user-1')
    expect(post).toHaveBeenCalledTimes(1); expect(mockedFetch).toHaveBeenCalledTimes(2)
  })
  it('keeps the session after a transient refresh failure and allows a later retry', async () => {
    mockedFetch.mockImplementation(async () => authFailure())
    const post = vi.spyOn(axios, 'post').mockRejectedValueOnce(new Error('offline'))
    await expect(graphqlClient.query({ query, fetchPolicy: 'network-only' })).rejects.toThrow('offline')
    expect(useAuthStore().refreshToken).toBe('first')
    mockedFetch.mockReset().mockResolvedValueOnce(authFailure()).mockResolvedValueOnce(success())
    post.mockResolvedValueOnce({ data: { token: jwt(), refreshToken: 'second' } })
    await graphqlClient.query({ query, fetchPolicy: 'network-only' }); expect(post).toHaveBeenCalledTimes(2)
  })
  it('shares a refresh with REST when both transports receive 401 together', async () => {
    const response = deferred<{ data: { token: string; refreshToken: string } }>()
    const post = vi.spyOn(axios, 'post').mockReturnValue(response.promise)
    mockedFetch.mockResolvedValueOnce(authFailure()).mockResolvedValueOnce(success())
    api.defaults.adapter = async (config) => {
      if (useAuthStore().refreshToken === 'first') throw new AxiosError('Unauthorized', undefined, config, undefined, { data: {}, status: 401, statusText: '', headers: {}, config })
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    }
    const rest = api.get('/main/users'), graphql = graphqlClient.query({ query, fetchPolicy: 'network-only' })
    await flush(); expect(post).toHaveBeenCalledTimes(1)
    response.resolve({ data: { token: jwt(), refreshToken: 'second' } })
    await Promise.all([rest, graphql]); expect(post).toHaveBeenCalledTimes(1)
  })
  it('stops after rejecting the replacement credentials once', async () => {
    mockedFetch.mockImplementation(async () => authFailure())
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { token: jwt(), refreshToken: 'second' } })
    await expect(graphqlClient.query({ query, fetchPolicy: 'network-only' })).rejects.toThrow()
    expect(post).toHaveBeenCalledTimes(1); expect(mockedFetch).toHaveBeenCalledTimes(2)
    expect(useAuthStore().isAuthenticated).toBe(false)
  })
  it('does not cache a late response after a different user signs in', async () => {
    const response = deferred<Response>(); mockedFetch.mockReturnValue(response.promise)
    const request = graphqlClient.query({ query, fetchPolicy: 'network-only' }); const rejection = expect(request).rejects.toThrow('session changed')
    await flush(); useAuthStore().logout(); useAuthStore().login(jwt('user-2'), 'new-user')
    response.resolve(success()); await rejection
    expect(graphqlClient.readQuery({ query })).toBeNull()
    expect(useAuthStore().user?.id).toBe('user-2')
  })
  it('does not refresh a forbidden response', async () => {
    mockedFetch.mockResolvedValue(new Response(JSON.stringify({ errors: [{ message: 'Forbidden', extensions: { code: 'AUTH_NOT_AUTHORIZED' } }] }), { status: 200, headers: { 'content-type': 'application/json' } }))
    const post = vi.spyOn(axios, 'post')
    await expect(graphqlClient.query({ query, fetchPolicy: 'network-only' })).rejects.toThrow('Forbidden')
    expect(post).not.toHaveBeenCalled(); expect(useAuthStore().isAuthenticated).toBe(true)
  })
})
