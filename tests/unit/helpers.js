// Simple helpers to mock Express req/res
function createReq(body = {}, { params = {}, headers = {}, user = {} } = {}) {
  return { body, params, headers, user };
}

function createRes() {
  const res = {};
  res.statusCode = 200;
  res.status = jest.fn((code) => { res.statusCode = code; return res; });
  res.json = jest.fn((data) => { res.data = data; return res; });
  return res;
}

module.exports = { createReq, createRes };
