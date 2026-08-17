'use strict'

const DEFAULT_TIMEOUT = 30000

class DebridLinkClient {

	constructor (token, defaultOptions = {}) {
		this.token = token
		this.base_url = defaultOptions.base_url || 'https://debrid-link.fr/api/v2/'
		this.defaultOptions = defaultOptions
		delete this.defaultOptions.base_url
		this._initMethods()
	}

	async _request (endpoint, o = {}) {
		const url = new URL(this.base_url + endpoint)
		for (const [key, value] of Object.entries(o.params || {})) {
			if (value !== undefined && value !== null) {
				url.searchParams.append(key, value)
			}
		}

		const headers = { ...this.defaultOptions.headers, ...o.headers }
		headers['Authorization'] = 'Bearer ' + this.token

		let body
		if (o.form) {
			body = new URLSearchParams()
			for (const [key, value] of Object.entries(o.form)) {
				if (value !== undefined && value !== null) {
					body.append(key, value)
				}
			}
		}

		const response = await fetch(url, {
			...this.defaultOptions.fetchInit,
			method: o.method,
			headers,
			body,
			signal: AbortSignal.timeout(this.defaultOptions.timeout || DEFAULT_TIMEOUT)
		})

		const text = await response.text()
		try {
			const data = text ? JSON.parse(text) : undefined
			if (data?.error) {
				throw data.error
			}
			if (!response.ok) {
				throw new Error(`Request failed (${response.status}): ${text.slice(0, 200)}`)
			}
			return data
		} catch (err) {
			if (err instanceof SyntaxError) {
				throw new Error(`Invalid response (${response.status}): ${text.slice(0, 200)}`)
			}
			throw err
		}
	}

	_get (endpoint, options = {}) {
		options.method = 'GET'
		options.params = options.params || {}
		if (this.defaultOptions.ip) {
			options.params.ip = this.defaultOptions.ip
		}
		return this._request(endpoint, options)
	}

	_delete (endpoint, options = {}) {
		options.method = 'DELETE'
		return this._request(endpoint, options)
	}

	_post (endpoint, options = {}) {
		options.method = 'POST'
		options.form = options.form || {}
		if (this.defaultOptions.ip) {
			options.form.ip = this.defaultOptions.ip
		}
		return this._request(endpoint, options)
	}

	_initMethods () {
		this.account = {
			infos: () => {
				return this._get('account/infos')
			},
			update: (https = 1, themeDark = 0, forceTranscode = 0, hideOldLinks = 0, avatarUrl = null) => {
				return this._post('account/update', {
					form: {
						https,
						themeDark,
						forceTranscode,
						hideOldLinks,
						avatarUrl
					}
				})
			}
		}

		this.seedbox = {
			list: (ids = null, page = 0, perPage = 50) => {
				return this._get('seedbox/list', {
					params: {
						ids,
						page,
						perPage
					}
				})
			},
			activity: (ids = null, page = 0, perPage = 50) => {
				return this._get('seedbox/activity', {
					params: {
						ids,
						page,
						perPage
					}
				})
			},
			add: (url = null, wait = false, async = false) => {
				return this._post('seedbox/add', {
					form: {
						url,
						wait,
						async
					}
				})
			},
			cached: (url = null) => {
				return this._get('seedbox/cached', {
					params: {
						url
					}
				})
			},
			remove: (idTorrents = null) => {
				return this._delete(`seedbox/${idTorrents}/remove`)
			},
			zip: (idTorrent = null, ids = null) => {
				return this._post(`seedbox/${idTorrent}/zip`, {
					form: {
						ids
					}
				})
			},
			config: (idTorrent = null, ids = null) => {
				return this._post(`seedbox/${idTorrent}/config`, {
					form: {
						'files-unwanted': ids
					}
				})
			},
			limits: () => {
				return this._get('seedbox/limits')
			},
			limitsCompare: () => {
				return this._get('seedbox/limits/compare')
			}
		}

		this.rss = {
			list: () => {
				return this._get('seedbox/rss/list')
			},
			add: (url = null, name = null) => {
				return this._post('seedbox/rss/add', {
					form: {
						url,
						name
					}
				})
			},
			test: (id = null, { autoEnabled, filterMethod, filterIncludeRegex, filterExcludeRegex, filterIncludeWords, filterExcludeWords } = {}) => {
				return this._post(`seedbox/rss/${id}/test`, {
					form: {
						autoEnabled,
						filterMethod,
						filterIncludeRegex,
						filterExcludeRegex,
						filterIncludeWords,
						filterExcludeWords
					}
				})
			},
			update: (id = null, { autoEnabled, filterMethod, filterIncludeRegex, filterExcludeRegex, filterIncludeWords, filterExcludeWords } = {}) => {
				return this._post(`seedbox/rss/${id}/update`, {
					form: {
						autoEnabled,
						filterMethod,
						filterIncludeRegex,
						filterExcludeRegex,
						filterIncludeWords,
						filterExcludeWords
					}
				})
			},
			remove: (ids = null) => {
				return this._delete(`seedbox/rss/${ids}/remove`)
			},
			limits: () => {
				return this._get('seedbox/rss/limits')
			},
			limitsCompare: () => {
				return this._get('seedbox/rss/limits/compare')
			}
		}

		this.downloader = {
			list: (page = 0, perPage = 50) => {
				return this._get('downloader/list', {
					params: {
						page,
						perPage
					}
				})
			},
			add: (url = null, password = null) => {
				return this._post('downloader/add', {
					form: {
						url,
						password
					}
				})
			},
			remove: (idLinks = null) => {
				return this._delete(`downloader/${idLinks}/remove`)
			},
			hosts: (types = null, keys = null) => {
				return this._get('downloader/hosts', {
					params: {
						types,
						keys
					}
				})
			},
			domains: () => {
				return this._get('downloader/domains')
			},
			limits: () => {
				return this._get('downloader/limits')
			}
		}

		this.files = {
			list: (idParent = null, page = 0, perPage = 50) => {
				return this._get(`files/${idParent}/list`, {
					params: {
						page,
						perPage
					}
				})
			}
		}

		this.transcode = {
			add: (id = null) => {
				return this._post('stream/transcode/add', {
					form: {
						id
					}
				})
			},
			infos: (id = null) => {
				return this._get(`stream/transcode/${id}/infos`)
			}
		}

	}

}

module.exports = DebridLinkClient
