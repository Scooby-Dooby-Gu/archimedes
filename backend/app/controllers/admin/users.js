export default function(app) {
  app.getAsync('/companies/:companyId/users', app.locals.adminOnly, async (req, res) => {
    var query = app.locals.SELECT("users", {
      attributes: ['id', 'name', 'email', 'phone_number', 'avatar', 'role', 'created_at'],

      where: {
        company_id: { param: 1}
      },

      limit: 20,
      page: { param: 2 }
    })
    return req.locals.select(
      query,
      [
        req.params.companyId,
        req.query.page || 1,

      ],
      'find-company-users'
    );
  })

  app.putAsync('/users/:userId/approve', app.locals.adminOnly, async (req, res) => {
    return await req.locals.selectOne(
      "UPDATE users SET verified_at = NOW() WHERE id = $1 RETURNING *", 
      [req.params.userId],
      'approve_users'
    );
  })

  app.getAsync('/users', app.locals.adminOnly, async (req, res) => {
    var where = req.query.verified == 'true' ? { verified_at: { $not: null }} :
                req.query.verified == 'false' ? { verified_at: null } :
                req.query.role ? { role: { paramArray: 2} } : 
                req.query.ids ? { id: { paramArray: 2} } : { 1: 1};

    var query = app.locals.SELECT("users", {
      attributes: ['id', 'name', 'email', 'phone_number', 'avatar', 'role', 'created_at', 'verified_at'],
      schema: 'private',

      where: where,

      limit: 20,
      sort: {
        id: 'users.desc'
      },
      page: { param: 1 },
    })


    if (req.query.ids) {
      var values = [ req.query.page || 1, req.query.ids.split(/\s*,\s*/g) ];
    } else if (req.query.role) {
      var values = [ req.query.page || 1, req.query.role.split(/\s*,\s*/g) ];
    } else {
      var values = [ req.query.page || 1]
    }

    return req.locals.selectAndCount(
      query,
      values,
      'find-admin-users-verified-' + JSON.stringify(where)
    );
  })
}