import { isAnyFunctionOrType }      from '@itrocks/class-type'
import { isAnyType }                from '@itrocks/class-type'
import { StringObject, Type }       from '@itrocks/class-type'
import { Request as ServerRequest } from '@itrocks/request-response'
import { dataSource, Entity }       from '@itrocks/storage'
import { formats }                  from './formats'

type Dependencies = {
	getModule: (route: string) => Function | Type | undefined
}

const depends: Dependencies = {
	getModule: function(route) {
		if (!route) return
		const module = require(route)
		return module.default ?? Object.values(module).find(type => isAnyType(type))
	}
}

export class Request<T extends object = object>
{
	action = ''
	format = ''
	ids:     string[] = []
	request: ServerRequest
	route  = ''

	private _objects?: (Entity<T>)[]

	constructor(request: ServerRequest)
	{
		this.request = request
		Object.assign(this, this.parsePath())
	}

	get data()
	{
		return this.request.data
	}

	async getObject() : Promise<Entity<T> | undefined>
	{
		if (!this._objects) {
			const id      = this.ids[0]
			const object  = id && await dataSource().read(this.type, id)
			this._objects = object ? [object] : []
		}
		return this._objects[0]
	}

	async getObjects(): Promise<Entity<T>[]>
	{
		this._objects ??= []
		if (this._objects.length >= this.ids.length) {
			return this._objects
		}
		const data = dataSource()
		for (const index in this.ids.slice(this._objects.length)) {
			this._objects[index] = await data.read(this.type, this.ids[index])
		}
		return Promise.all(this._objects)
	}

	parsePath(): Partial<Request<T>>
	{
		const route  = '(?<route>(?:/[A-Za-z][A-Za-z0-9-]*)+)'
		const id     = '(?:/(?<id>(?!,)(?:,?[0-9]+)+))'
		const action = '(?:/(?<action>[A-Za-z-]+))'
		const format = '(?:/(?<format>[A-Za-z-]+))'

		const request = this.request
		const method  = request.method
		const regExp  = `^${route}${id}?${action}?${format}?$`
		const match   = request.path.match(RegExp(regExp))
			?? { groups: { route: '' }}
		type Groups = { action?: string, format?: string, id?: string, route: string }
		const path: Partial<Request<T>> & Groups = match.groups as Groups

		// ids <- id
		path.ids = path.id?.split(',') ?? []
		delete path.id

		if (!path.format) {
			// format <- action
			if (path.action && formats.find(([isFormat]) => path.action === isFormat)) {
				path.format = path.action
				path.action = ''
			}
			else {
				// format <- route
				const position = path.route.lastIndexOf('/')
				const format   = path.route.substring(position + 1)
				if (formats.find(([isFormat]) => format === isFormat)) {
					path.format = format
					path.route = path.route.substring(0, position)
				}
				// format <- accept
				else if (request.headers.accept) {
					for (const acceptMime of request.headers.accept.split(',')) {
						const format = formats.find(([, mime]) => acceptMime === mime)
						if (format) {
							path.format = format[0]
							break
						}
					}
				}
			}
			// format <- default
			if (!path.format) {
				path.format = 'html'
			}
		}

		if (path.route === '') {
			return path
		}

		if (!path.action && isAnyType(depends.getModule(path.route))) {
			// action <- method
			const method0 = method[0]
			if (path.ids.length) {
				switch (method0) {
					case 'D': path.action = 'delete'; break
					case 'G': path.action = 'output'; break
					case 'P': path.action = 'save'
				}
			}
			else if ((method0 === 'P') && (path.format === 'json')) {
				path.action = 'save'
				if (path.route.endsWith('/save')) {
					path.route = path.route.substring(0, path.route.lastIndexOf('/'))
				}
			}
			// action <- route
			else if (path.route.lastIndexOf('/') > 0) {
				const position = path.route.lastIndexOf('/')
				path.action    = path.route.substring(position + 1)
				path.route     = path.route.substring(0, position)
			}
			// action <- default
			else {
				switch (method0) {
					case 'D': path.action = 'delete'; break
					case 'G': path.action = 'list';   break
					case 'P': path.action = 'save'
				}
			}
		}

		const dataId = request.data.id as string | StringObject | string[]
		if (dataId) {
			if (typeof dataId === 'string') {
				path.ids.push(...dataId.split(','))
			}
			else if (Array.isArray(dataId)) {
				path.ids.push(...dataId)
			}
			else if (typeof dataId === 'object') {
				path.ids.push(...Object.values(dataId))
			}
		}

		return path
	}

	get type(): Type<T>
	{
		const type = depends.getModule(this.route)
		if (!type) return class {} as Type<T>

		if (!isAnyFunctionOrType(type)) {
			throw 'Module ' + this.route.substring(1) + ' is not a class or function'
		}
		Object.defineProperty(this, 'type', { configurable: true, enumerable: false, value: type, writable: true })
		return type as Type<T>
	}

}

export { formats }

export function actionRequestDependsOn(dependencies: Partial<Dependencies>)
{
	Object.assign(depends, dependencies)
}
