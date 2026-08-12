const assert = require('node:assert/strict')
const { describe, it } = require('node:test')
const { Request: ServerRequest } = require('@itrocks/request-response')
const { actionRequestDependsOn } = require('../cjs/action-request')
const { Request } = require('../cjs/action-request')

class DomainObject {}

actionRequestDependsOn({
	getModule: route => (route === '/user') ? DomainObject : undefined,
	isDomainObject: object => object === DomainObject
})

function pathTuple(path)
{
	return [path.route, path.ids, path.action, path.format]
}

describe('parsePath', () => {
	const acceptJson    = { accept: 'application/unknown,application/json' }
	const acceptUnknown = { accept: 'application/unknown' }

	it('deleteActionDefault', () => {
		const path = new Request(new ServerRequest('DELETE', 'https', 'test', 443, '/user/1/csv', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', ['1'], 'delete', 'csv'])
	})
	it('deleteActionFormatAccept', () => {
		const path = new Request(new ServerRequest('DELETE', 'https', 'test', 443, '/user/1', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', ['1'], 'delete', 'json'])
	})
	it('deleteActionFormatDefault', () => {
		const path = new Request(new ServerRequest('DELETE', 'https', 'test', 443, '/user/1', acceptUnknown)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', ['1'], 'delete', 'html'])
	})
	it('deleteExplicit', () => {
		const path = new Request(new ServerRequest('DELETE', 'https', 'test', 443, '/user/1/action/csv', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', ['1'], 'action', 'csv'])
	})
	it('deleteFormatAccept', () => {
		const path = new Request(new ServerRequest('DELETE', 'https', 'test', 443, '/user/1/action', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', ['1'], 'action', 'json'])
	})
	it('deleteFormatDefault', () => {
		const path = new Request(new ServerRequest('DELETE', 'https', 'test', 443, '/user/1/action', acceptUnknown)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', ['1'], 'action', 'html'])
	})
	it('getActionFormatIdAccept', () => {
		const path = new Request(new ServerRequest('GET', 'https', 'test', 443, '/user/1', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', ['1'], 'output', 'json'])
	})
	it('getActionFormatIdDefault', () => {
		const path = new Request(new ServerRequest('GET', 'https', 'test', 443, '/user/1', acceptUnknown)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', ['1'], 'output', 'html'])
	})
	it('getActionFormatNoIdAccept', () => {
		const path = new Request(new ServerRequest('GET', 'https', 'test', 443, '/user', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', [], 'list', 'json'])
	})
	it('getActionFormatNoIdDefault', () => {
		const path = new Request(new ServerRequest('GET', 'https', 'test', 443, '/user', acceptUnknown)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', [], 'list', 'html'])
	})
	it('getActionFormatNoIdRoute', () => {
		const path = new Request(new ServerRequest('GET', 'https', 'test', 443, '/user/action/csv', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', [], 'action', 'csv'])
	})
	it('getActionIdDefault', () => {
		const path = new Request(new ServerRequest('GET', 'https', 'test', 443, '/user/1/csv', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', ['1'], 'output', 'csv'])
	})
	it('getActionNoIdDefault', () => {
		const path = new Request(new ServerRequest('GET', 'https', 'test', 443, '/user/csv', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', [], 'list', 'csv'])
	})
	it('getExplicit', () => {
		const path = new Request(new ServerRequest('GET', 'https', 'test', 443, '/user/1,2/merge/csv', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', ['1', '2'], 'merge', 'csv'])
	})
	it('getFormatIdAccept', () => {
		const path = new Request(new ServerRequest('GET', 'https', 'test', 443, '/user/1/magnify', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', ['1'], 'magnify', 'json'])
	})
	it('getFormatIdDefault', () => {
		const path = new Request(new ServerRequest('GET', 'https', 'test', 443, '/user/1/magnify', acceptUnknown)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', ['1'], 'magnify', 'html'])
	})
	it('getFormatNoIdAccept', () => {
		const path = new Request(new ServerRequest('GET', 'https', 'test', 443, '/user/action', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', [], 'action', 'json'])
	})
	it('getFormatNoIdDefault', () => {
		const path = new Request(new ServerRequest('GET', 'https', 'test', 443, '/user/action', acceptUnknown)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', [], 'action', 'html'])
	})
	it('patchActionDefault', () => {
		const path = new Request(new ServerRequest('PATCH', 'https', 'test', 443, '/user/1/csv', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', ['1'], 'save', 'csv'])
	})
	it('patchActionFormatAccept', () => {
		const path = new Request(new ServerRequest('PATCH', 'https', 'test', 443, '/user/1', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', ['1'], 'save', 'json'])
	})
	it('patchActionFormatDefault', () => {
		const path = new Request(new ServerRequest('PATCH', 'https', 'test', 443, '/user/1', acceptUnknown)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', ['1'], 'save', 'html'])
	})
	it('patchExplicit', () => {
		const path = new Request(new ServerRequest('PATCH', 'https', 'test', 443, '/user/1/action/csv', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', ['1'], 'action', 'csv'])
	})
	it('patchFormatAccept', () => {
		const path = new Request(new ServerRequest('PATCH', 'https', 'test', 443, '/user/1/action', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', ['1'], 'action', 'json'])
	})
	it('patchFormatDefault', () => {
		const path = new Request(new ServerRequest('PATCH', 'https', 'test', 443, '/user/1/action', acceptUnknown)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', ['1'], 'action', 'html'])
	})
	it('postFormatAccept', () => {
		const path = new Request(new ServerRequest('POST', 'https', 'test', 443, '/user', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', [], 'save', 'json'])
	})
	it('postFormatDefault', () => {
		const path = new Request(new ServerRequest('POST', 'https', 'test', 443, '/user', acceptUnknown)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', [], 'save', 'html'])
	})
	it('postFormatRoute', () => {
		const path = new Request(new ServerRequest('POST', 'https', 'test', 443, '/user/csv', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', [], 'save', 'csv'])
	})
	it('neverDeleteEmpty', () => {
		const path = new Request(new ServerRequest('DELETE', 'https', 'test', 443, '/', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['', [], undefined, 'json'])
	})
	it('neverDeleteNoId', () => {
		const path = new Request(new ServerRequest('DELETE', 'https', 'test', 443, '/user', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', [], 'delete', 'json'])
	})
	it('neverDeleteNoIdActionFormat', () => {
		const path = new Request(new ServerRequest('DELETE', 'https', 'test', 443, '/user/action/csv', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', [], 'action', 'csv'])
	})
	it('neverGetEmpty', () => {
		const path = new Request(new ServerRequest('GET', 'https', 'test', 443, '/', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['', [], undefined, 'json'])
	})
	it('neverGetNoAction', () => {
		const path = new Request(new ServerRequest('GET', 'https', 'test', 443, '/csv', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['', [], undefined, 'csv'])
	})
	it('neverPatchEmpty', () => {
		const path = new Request(new ServerRequest('PATCH', 'https', 'test', 443, '/', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['', [], undefined, 'json'])
	})
	it('neverPatchNoId', () => {
		const path = new Request(new ServerRequest('PATCH', 'https', 'test', 443, '/user', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', [], 'save', 'json'])
	})
	it('neverPatchNoIdActionFormat', () => {
		const path = new Request(new ServerRequest('PATCH', 'https', 'test', 443, '/user/action/csv', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', [], 'action', 'csv'])
	})
	it('neverPostAction', () => {
		const path = new Request(new ServerRequest('POST', 'https', 'test', 443, '/user/action/csv', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', [], 'action', 'csv'])
	})
	it('neverPostEmpty', () => {
		const path = new Request(new ServerRequest('POST', 'https', 'test', 443, '/', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['', [], undefined, 'json'])
	})
	it('neverPostId', () => {
		const path = new Request(new ServerRequest('POST', 'https', 'test', 443, '/user/1', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', ['1'], 'save', 'json'])
	})
	it('neverPostIdAction', () => {
		const path = new Request(new ServerRequest('POST', 'https', 'test', 443, '/user/1/action', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', ['1'], 'action', 'json'])
	})
	it('neverPostIdActionFormat', () => {
		const path = new Request(new ServerRequest('POST', 'https', 'test', 443, '/user/1/action/csv', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', ['1'], 'action', 'csv'])
	})
	it('neverPostIdFormat', () => {
		const path = new Request(new ServerRequest('POST', 'https', 'test', 443, '/user/1/csv', acceptJson)).parsePath()
		assert.deepEqual(pathTuple(path), ['/user', ['1'], 'save', 'csv'])
	})
})
