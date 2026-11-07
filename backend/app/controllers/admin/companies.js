export async function addCompanyManager(req, company, user) {
  // assign company management to current user, unless admin
  if (!company.managerIds.includes(user.id)) {
    const managerIds = company.managerIds.concat(user.id);
    await req.locals.query(
      "UPDATE companies SET manager_ids=$1 WHERE id=$2",
      [managerIds, company.id],
      'update-company-managers'
    )
    return managerIds;
  }
  return company.managerIds;
}

export default (app, req) => {
  app.postAsync('/companies/:companyId?', app.locals.findCompany, app.locals.managerOnly, app.locals.upload.single('company[image]'), async (req, res) => {
    const company = await req.locals.selectOne(
      app.locals.UPSERT('companies', ['name', 'wildcards', 'status', 'url', 'description', 'subdomain', 'plan401k',  'invite_token']),
      [JSON.stringify({
        ...req.body.company,
        //topic_id: req.body.company.topic_Id || null,
        status: req.body.company.status === 'enabled' ? 'enabled' : 'disabled',
        wildcards: (req.body.company.wildcards || []).map((e) => e.trim()).filter((e) => e), 
        id: req.params.companyId || null,
      })],
      'upsert-companies'
    );
    


    if (company && req.file) {
      const avatarPath = `companies/${company.id}.${req.file.mimetype.split('/')[1].split('+')[0]}`
      const sizes = await app.locals.s3uploadResponsive(req.file, avatarPath, [400, 800, 1024]);
      await req.locals.query(
        "UPDATE companies SET image = $1, image_sizes = $2 WHERE id = $3", 
        [sizes.default, sizes, company.id]);
      company.imageSizes = sizes
        company.image = sizes.default
    }

    console.log(company, 777)
    if (!company.topicId) {
      const topic = await req.locals.selectOne(
        app.locals.UPSERT('topics', ['board_id', 'name']),
        [JSON.stringify({
          name: company.name,
          board_id: 0
        })],
        'upsert-company-topic'
      );
      await req.locals.query(
        "UPDATE companies SET topic_id = $1 WHERE id = $2", 
        [topic.id, company.id]);
      company.topicId = topic.id;
    }

    if (req.locals.user.role != 'admin')
      return {
        company: {
          ...company,
          managerIds: await addCompanyManager(req, company, req.locals.user)
        }
      }


    return { company };
  })

  app.getAsync('/companies/:companyId/invite', app.locals.managerOnly, async (req, res) => {
    var invite  = await req.locals.selectOne(
      'SELECT token FROM invites WHERE company_id=$1 AND email is NULL',
      [req.params.companyId]
    );
    if (!invite) {
      var invite = await req.locals.selectOne(
        'INSERT INTO invites(token, company_id, created_at, updated_at) VALUES($1,$2,$3,$4) RETURNING *',
        [app.locals.genRandomString(32), req.params.companyId, new Date, new Date],
      )
    }
    return { invite }
  })

  app.getAsync('/companies/', app.locals.adminOnly, async (req, res) => {
    const query = app.locals.SELECT("companies", {
      attributes: ['id', 'wildcards', 'status', 'name', 'image', 'image_sizes',  'subdomain', 'description', 'url', 'plan401k', 'user_count', 'topic_id', 'manager_ids']
    });
    return req.locals.select(
      query, 
      [], 
      'find-companies'
    );
  });

  app.getAsync('/companies/:companyId', app.locals.findCompany, app.locals.memberOnly, async (req, res) => {
    return {company: req.locals.company}
  });
  app.deleteAsync('/companies/:companyId', app.locals.findCompany, app.locals.managerOnly, async (req, res) => {
    return req.locals.selectOne('DELETE FROM companies WHERE id=$1', [req.locals.company.id], 'delete-company')
  });

}