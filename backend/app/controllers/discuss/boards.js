export default (app, req) => {
  app.postAsync('/boards/:boardId?', app.locals.upload.single('board[image]'), async (req, res) => {
    const results = await req.locals.query(
      app.locals.UPSERT('boards', ['name', 'description']),
      [JSON.stringify({
        ...req.body.board,
        id: req.params.boardId || null,
      })]
    );

    const board = results.rows[0];
    if (board && req.file) {
      const path = `boards/${board.id}.${req.file.mimetype.split('/').pop().split('+')[0]}`;
      board.image = await app.locals.s3uploadAndUnlink(req.file, path);
      await req.locals.query(
        "UPDATE boards SET image = $1 WHERE id = $2", 
        [board.image, board.id]
      );
    }
    return { board };
  })


  app.getAsync('/boards/:boardId', async (req, res) => {
    const query = app.locals.SELECT("boards", {
      attributes: ['id', 'name', 'description', 'cover', 'icon', 'color'],

      topics: {
        attributes: ['id', 'name', 'description', 'cover', 'icon', 'discussion_count', 'is_hidden'],
        sort: {order: 'asc'}
      },

      where: {
        id: { param: 1}
      },

      sort: {order: 'asc'}
    });
    const board = await req.locals.selectOne(
      query,
      [req.params.boardId],
      'find-board'
    );
    return { board }
  });
}