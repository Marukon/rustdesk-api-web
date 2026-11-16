import request from '@/utils/request'

export function loginOptions () {
  return request({
    url: '/login-options',
    method: 'get',
    loginFlow: true,
  })
}

export function oidcAuth (data) {
  return request({
    url: '/oidc/auth',
    method: 'post',
    loginFlow: true,
    data,
  })
}

export function oidcQuery (params) {
  return request({
    url: '/oidc/auth-query',
    method: 'get',
    loginFlow: true,
    params,
  })
}

export function captcha () {
  return request({
    url: '/captcha',
    method: 'get',
    loginFlow: true,
  })
}

export function logout () {
  return request({ url: '/logout', method: 'post', timeout: 10000 })
}
