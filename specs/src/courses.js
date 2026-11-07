const helpers = require('./helpers');

const { it, describe } = helpers;

describe('Courses', () => {
  var courseId;

 it('can create, update and delete a course', async () => {
    var admin = await helpers.homePage('SUPER-SECRET-ADMIN');
    await admin.log('Create a new course')
    await admin.click('menu [href="/courses"]');
    await admin.shouldSeeText('Start learning');
    await admin.click('a[href*="/courses/new"]')

    await admin.type('input[name="course[name]"]', 'Bad advices');
    await admin.select('select[name="course[difficulty]"]', 'advanced');
    await admin.select('select[name="course[color]"]', 'violet');
    await admin.type('textarea[name="course[description]"]', 'Oh yeah man');

    await admin.attachFile('input[name="course[icon]"]', 'assets/avatar.jpg')

    await admin.clickText('Create');
    await admin.shouldNotSeeText('New course');

    var courseId = (await admin.matchURL(/courses\/(\d+)/))[1];

    var user = await helpers.homePage('USER');
    await user.log('User sees the course')
    await user.goto(`http://app.getmedes.xxx:8080/courses/`);
    await user.shouldSeeText('Start learning');
    await user.shouldSeeText('Bad advices', `#courses-${courseId}`);
    await user.shouldSeeText('Advanced', `#courses-${courseId}`);
    await user.shouldSeeText('Start course', `#courses-${courseId}`);
    await user.shouldSeeElement(`#courses-${courseId}.theme-violet`);
    await user.shouldSeeElement(`#courses-${courseId} img[src*="/${courseId}.jpeg"]`);
    await user.click(`[href*="/courses/${courseId}"]`);
    await user.shouldSeeText('Oh yeah man', `#course-${courseId}`);

    await admin.log('Admnin sets course hidden')
    await admin.goto(`http://app.getmedes.xxx:8080/courses/${courseId}`);
    await admin.click('h1 [href*="/edit"]');
    await admin.select('select[name="course[state]"]', 'hidden');
    await admin.type('input[name="course[name]"]', 'Bad advicez');
    await admin.select('select[name="course[difficulty]"]', 'expert');
    await admin.select('select[name="course[color]"]', 'black');
    await admin.type('textarea[name="course[description]"]', 'Oh yeah woman');
    await admin.clickText('Save');
    await admin.shouldNotSeeElement('button[disabled]');
    //await admin.wait(200);

    await user.log('User wont see course anymore')
    await user.goto('http://app.getmedes.xxx:8080/courses');
    await user.shouldSeeText('Start learning');
    await user.shouldNotSeeElement(`#courses-${courseId}`);

    await admin.log('Admin still sees the course')
    await admin.goto('http://app.getmedes.xxx:8080/courses');
    await admin.shouldSeeText('Start learning');
    await admin.shouldSeeText('Hidden', `#courses-${courseId}`);
    await admin.shouldSeeText('Bad advicez', `#courses-${courseId}`);
    await admin.shouldSeeText('Expert', `#courses-${courseId}`);
    await admin.shouldSeeElement(`#courses-${courseId} img[src*="/${courseId}.jpeg"]`);
    await admin.shouldSeeElement(`#courses-${courseId}.theme-black`);

    await admin.log('Admin makes course private')
    await admin.wait(100);
    await admin.click(`[href*="/courses/${courseId}"]`);
    await admin.click('h1 [href*="/edit"]');
    await admin.select('select[name="course[state]"]', 'preview');
    await admin.clickText('Save');
    await admin.shouldNotSeeElement('button[disabled]');
    await admin.wait(200);
    await admin.click('menu [href="/courses"]');
    await admin.shouldSeeElement(`#courses-${courseId}`);
    await admin.shouldSeeText('Coming soon', `#courses-${courseId}`);
    

    await user.log('User see course preview')
    await user.goto(`http://app.getmedes.xxx:8080/courses/`);
    await user.shouldSeeText('Coming soon', `#courses-${courseId}`);

    
    await admin.log('Admin deletes course')
    await admin.goto(`http://app.getmedes.xxx:8080/courses/`);
    await admin.click(`[href*="/courses/${courseId}"]:not([href*="lessons"])`);
    await admin.click('h1 [href*="/edit"]');
    await admin.acceptNextConfirmation()
    await admin.clickText('Delete course');
    await admin.click('menu [href="/courses"]');
    await admin.shouldNotSeeElement(`#courses-${courseId}`);

    await user.log('User can not see deleted course')
    await user.goto(`http://app.getmedes.xxx:8080/courses/`);
    await user.shouldNotSeeElement(`#courses-${courseId}`);
  })


  it('can create track and assign lessons', async () => {
    var admin = await helpers.homePage('SUPER-SECRET-ADMIN');
    await admin.log('Create a new track')
    await admin.click('menu [href="/courses"]');
    await admin.shouldSeeText('Start learning');

    await admin.click('a[href*="/courses/new"]')

    await admin.type('input[name="course[name]"]', 'Best luck');
    await admin.select('[name="course[difficulty]"]', 'beginner');
    await admin.select('[name="course[color]"]', 'orange');
    await admin.type('[name="course[description]"]', 'Oh yeah ma2n');
    await admin.clickText('Create');
    await admin.shouldSeeElement('[route="course"]');
    var courseId = (await admin.matchURL(/\/courses\/([\d]+)/))[1]

    await admin.click('menu [href="/courses"]');
    await admin.click('a[href*="/courses/new"]')

    await admin.type('input[name="course[name]"]', 'Good luck');
    await admin.select('[name="course[difficulty]"]', 'beginner');
    await admin.select('[name="course[color]"]', 'black');
    await admin.type('[name="course[description]"]', 'Oh yeah man');
    await admin.clickText('Create');
    await admin.shouldNotSeeText('Create');
    var course2Id = (await admin.matchURL(/\/courses\/([\d]+)/))[1]

    await admin.log('Create a lesson in specific course');
    await admin.click('a[href*="/lessons/new"]')
    
    await admin.type('[name="lesson[name]"]', 'How to be nasty');
    await admin.type('[name="lesson[duration]"]', '12');
    await admin.select('[name="lesson[difficulty]"]', 'beginner');
    await admin.type('[name="lesson[description]"]', 'It is really difficult to be goodie two shoes');

    await admin.select('[name="lesson[courseId]"]', course2Id);
    await admin.clickText('Save');
    await admin.shouldNotSeeElement('button[disabled]');
    //await admin.wait(200);

    await admin.matchURL(`/courses/${course2Id}/`)
    await admin.wait(150);

    await admin.click('menu [href="/courses"]');
    await admin.click(`[href*="/courses/${courseId}"]`);
    await admin.shouldNotSeeText('How to be nasty');;
    await admin.click('menu [href="/courses"]');
    await admin.click(`[href*="/courses/${course2Id}"]`);
    await admin.clickText('How to be nasty');
    await admin.clickText('Start lesson');
    
    await admin.log('Reassign course');
    await admin.click(`[href*="/edit"][href*="/lessons"]`);
    
    await admin.select('[name="lesson[courseId]"]', courseId);
    await admin.type('[name="lesson[name]"]', 'How to be perfect');
    await admin.clickText('Save');
    await admin.shouldNotSeeElement('button[disabled]');
    await admin.shouldSeeText('How to be perfect');
    expect((await admin.url())).not.toContain(`/courses/${course2Id}/`)
    expect((await admin.url())).toContain(`/courses/${courseId}/`)

    await admin.shouldSeeText('How to be perfect');
    await admin.click('menu [href="/courses"]');
    await admin.wait(100);
    await admin.click(`[href*="/courses/${courseId}"]`);
    await admin.shouldSeeText('How to be perfect');
    await admin.click('menu [href="/courses"]');
    await admin.click(`[href*="/courses/${course2Id}"]`);
    await admin.shouldNotSeeText('How to be perfect');
  })
  var lessonId;
  
  it('can create lesson', async () => {
    const admin = await helpers.getPage('SUPER-SECRET-ADMIN');
    await admin.log('Create a new course')
    await admin.goto('http://app.getmedes.xxx:8080/courses/');
    await admin.shouldSeeText('Start learning');
    await admin.click('a[href*="/courses/new"]')

    await admin.attachFile('[name="course[icon]"]', 'assets/avatar.jpg')
    await admin.type('input[name="course[name]"]', 'Good advices');
    await admin.select('[name="course[difficulty]"]', 'advanced');
    await admin.select('[name="course[color]"]', 'violet');
    await admin.type('[name="course[description]"]', 'Oh yeah man');

    await admin.clickText('Create');

    courseId = (await admin.matchURL(/courses\/(\d+)/))[1];

    await admin.click('a[href*="/lessons/new"]')
    

    await admin.type('[name="lesson[name]"]', 'How to be good');
    await admin.type('[name="lesson[duration]"]', '12');
    await admin.select('[name="lesson[difficulty]"]', 'beginner');

    await admin.type('[name="lesson[description]"]', 'It is really difficult to be goodie two shoes');


    await admin.log('Play with ckeditor')
    await admin.type('article[name="lesson[contentHtml]"]', 'Oh hello this is megatitle\n then smalling\nand this is a tinyparagraph');
    await admin.clickText('Oh hello this is megatitle', { tags: ['p'] })
    await admin.click('.ck-block-toolbar-button:not(.ck-hidden)')
    await admin.attachFile('[name="lesson[image]"]', 'assets/cover.png');
    await admin.click('.ck-balloon-panel_visible .ck-dropdown__button')
    await admin.clickText('Heading 1', {context: '.ck-balloon-panel_visible'})
    await admin.clickText('smalling', { tags: ['p'] })
    await admin.click('.ck-block-toolbar-button:not(.ck-hidden)')
    await admin.click('.ck-balloon-panel_visible .ck-dropdown__button')
    await admin.clickText('Heading 2', {context: '.ck-balloon-panel_visible'})
    await admin.click('.ck-block-toolbar-button:not(.ck-hidden)')
    await admin.click('.ck-balloon-panel_visible .ck-toolbar__items > button:last-child')
    await admin.clickText('smalling', { tags: ['h3'] })
    await admin.click('.ck-block-toolbar-button:not(.ck-hidden)')
    await admin.click('.ck-balloon-panel_visible .ck-toolbar__items > button:last-child')
    await admin.clickText('smalling', { tags: ['h3'] })
    await admin.click('.ck-block-toolbar-button:not(.ck-hidden)')
    await admin.attachFile('.ck-balloon-panel_visible input[type="file"]', 'assets/cover.png', true)
    await admin.wait(500);

    await admin.type('article[name="lesson[supplementaryMaterialsHtml]"]', 'Supplementary materials YEY');
    await admin.wait(500);
    await admin.type('article[name="lesson[actionableAdviceHtml]"]', 'Actionable advice YEY');
    await admin.wait(500);
    await admin.type('article[name="lesson[afterQuizHtml]"]', 'After quiz YEY');
    await admin.wait(500);
    await admin.shouldNotSeeElement('[index="action"][disabled]', 30);

    await admin.clickText('Save');
    await admin.shouldNotSeeElement('button[disabled]');
    await admin.shouldNotSeeText('Lesson name');
    lessonId = (await admin.matchURL(/lessons\/(\d+)/))[1];

    await admin.log('See changes')
    await admin.shouldSeeText('Beginner', '[index="start"]')
    await admin.shouldSeeText('How to be good', '[index="start"]')
    await admin.shouldSeeText('It is really difficult to be goodie two shoes', '[index="start"]')
    await admin.shouldSeeText('12min', '[index="start"]')
    
    await admin.wait(300);
    await admin.clickText('Start lesson', '[index="start"]')
    await admin.shouldSeeText('How to be good', '[route="lesson"]')
    await admin.shouldSeeText('It is really difficult to be goodie two shoes', '[index="read"]')
    await admin.shouldSeeText('Supplementary materials YEY', '[index="read"]')
    await admin.shouldSeeText('Actionable advice YEY', '[index="read"]')
    await admin.shouldSeeElement('[route="lesson"] .cover img[src*="s3"][srcset*="400"][srcset*="768"]')
    await admin.shouldSeeElement('[index="read"] figure img[src*="embeds"][srcset*="400"][srcset*="768"]')
    await admin.shouldNotSeeText('Start quiz');

    await admin.click('[route="lesson"] h1 a');

    await admin.shouldNotSeeText('Start quiz');
    await admin.shouldSeeText('Cover image');

    await admin.type('[name="lesson[questions][0][title]"]', 'Q#1 Single choice')
    await admin.type('[name="lesson[questions][0][correction]"]', 'Q#1 incorrect')
    await admin.type('[name="lesson[questions][0][options][0][name]"]', 'Q#1 A#1 title')
    await admin.click('[name="lesson[questions][0][options][0][correct]"]')
    await admin.clickText('Add option', {context: 'fieldset[index="0"]'})
    await admin.type('[name="lesson[questions][0][options][1][name]', 'Q#1 A#2 title')
    await admin.clickText('Add question')
    await admin.clickText('Add question')
    await admin.clickText('Add option', {context: 'fieldset[index="1"]'})
    await admin.clickText('Add option', {context: 'fieldset[index="1"]'})
    await admin.clickText('Add option', {context: 'fieldset[index="2"]'})
    await admin.clickText('Add option', {context: 'fieldset[index="2"]'})
    await admin.clickText('Add option', {context: 'fieldset[index="2"]'})

    await admin.type('[name="lesson[questions][1][title]"]', 'Q#2 Multi choice')
    await admin.type('[name="lesson[questions][1][correction]"]', 'Q#2 incorrect')
    await admin.type('[name="lesson[questions][1][options][0][name]"]', 'Q#2 A#1 title')
    await admin.click('[name="lesson[questions][1][options][0][correct]"]')
    await admin.type('[name="lesson[questions][1][options][1][name]"]', 'Q#2 A#2 title')
    await admin.click('[name="lesson[questions][1][options][1][correct]"]')
    await admin.type('[name="lesson[questions][1][options][2][name]"]', 'Q#2 A#3 title')

    await admin.type('[name="lesson[questions][2][title]"]', 'Q#3 Ranking')
    await admin.type('[name="lesson[questions][2][correction]"]', 'Q#3 incorrect')
    await admin.type('[name="lesson[questions][2][options][0][name]"]', 'Q#3 A#1 title')
    await admin.type('[name="lesson[questions][2][options][1][name]"]', 'Q#3 A#2 title')
    await admin.select('[name="lesson[questions][2][type]"]', 'ranking')
    await admin.type('[name="lesson[questions][2][options][2][name]"]', 'Q#3 A#X title')
    await admin.click('fieldset[index="2"] [index="2"] .IIconsClose'  )
    await admin.type('[name="lesson[questions][2][options][2][name]"]', 'Q#3 A#3 title')
    await admin.clickText('Add question')
    await admin.select('[name="lesson[questions][3][type]"]', 'blanks')
    await admin.type('[name="lesson[questions][3][title]"]', 'Q#4 __ Blanks __ ')
    await admin.type('[name="lesson[questions][3][correction]"]', 'Q#4 incorrect')
    await admin.clickText('Add option', {context: 'fieldset[index="3"]'})
    await admin.clickText('Add option', {context: 'fieldset[index="3"]'})
    await admin.clickText('Add option', {context: 'fieldset[index="3"]'})
    await admin.type('[name="lesson[questions][3][options][0][name]"]', 'Q#4 A#1')
    await admin.type('[name="lesson[questions][3][options][1][name]"]', 'Q#4 A#2')
    await admin.type('[name="lesson[questions][3][options][2][name]"]', 'Q#4 A#3')
    await admin.type('[name="lesson[questions][3][options][3][name]"]', 'Q#4 A#4')
     
    await admin.clickText('Add question')
    await admin.select('[name="lesson[questions][4][type]"]', 'match')
    await admin.type('[name="lesson[questions][4][title]"]', 'Q#5 Match ')
    await admin.type('[name="lesson[questions][4][correction]"]', 'Q#5 incorrect')
    await admin.clickText('Add option', {context: 'fieldset[index="4"]'})
    await admin.clickText('Add option', {context: 'fieldset[index="4"]'})
    await admin.clickText('Add option', {context: 'fieldset[index="4"]'})
    await admin.type('[name="lesson[questions][4][options][0][name]"]', 'Q#5 A#1')
    await admin.type('[name="lesson[questions][4][options][1][name]"]', 'Q#5 A#2')
    await admin.type('[name="lesson[questions][4][options][2][name]"]', 'Q#5 A#3')
    await admin.type('[name="lesson[questions][4][options][3][name]"]', 'Q#5 A#4')
    await admin.type('[name="lesson[questions][4][options][0][group]"]', 'Q#5 G#1')
    await admin.type('[name="lesson[questions][4][options][1][group]"]', 'Q#5 G#1')
    await admin.type('[name="lesson[questions][4][options][2][group]"]', 'Q#5 G#2')
    await admin.type('[name="lesson[questions][4][options][3][group]"]', 'Q#5 G#2')
    
    await admin.clickText('Save');
    await admin.shouldNotSeeElement('button[disabled]');
    await admin.clickText('Start lesson');
    await admin.shouldSeeText('Start quiz');
    await admin.shouldSeeText('Q#1', '[index="read"]')
    await admin.shouldSeeText('Q#2', '[index="read"]')
    await admin.shouldNotSeeText('Q#3', '[index="read"]')
  })

  it('can pass quiz', async () => {
    const user = await helpers.getPage('USER');
    await user.goto(`http://app.getmedes.xxx:8080/courses/${courseId}/lessons/${lessonId}`);
    await user.clickText('Start lesson');
    await user.log('Single choice question');
    await user.shouldSeeText('Select the correct answer.');
    await user.click('#lesson-question-0');
    await user.wait(100);
    await user.click('#lesson-question-0 input[name="answer[]"][value="1"]')
    await user.shouldNotSeeText('Q#1 incorrect');
    await user.clickText('Submit answer', { context: '#lesson-question-0'});
    await user.shouldSeeText('Q#1 incorrect');
    await user.click('#lesson-question-0 input[name="answer[]"][value="0"]')
    await user.shouldNotSeeText('Q#1 incorrect');
    await user.clickText('Submit answer', { context: '#lesson-question-0'});
    await user.shouldNotSeeText('Q#1 incorrect');
    await user.shouldSeeElement('#lesson-question-0.correct');

    await user.log('Multiple choice question');
    await user.click('#lesson-question-1');
    await user.shouldSeeText('Select the correct answers.');
    await user.shouldSeeText('Q#2 Multi choice');
    await user.click('#lesson-question-1 input[name="answer[]"][value="0"]')
    await user.wait(50);
    await user.clickText('Submit answer', { context: '#lesson-question-1'});
    await user.shouldSeeText('Q#2 incorrect');
    await user.click('#lesson-question-1 input[name="answer[]"][value="2"]')
    await user.wait(50);
    await user.shouldNotSeeText('Q#2 incorrect');
    await user.wait(50);
    await user.clickText('Submit answer', { context: '#lesson-question-1'});
    await user.shouldSeeText('Q#2 incorrect', '#lesson-question-1');
    await user.click('#lesson-question-1 input[name="answer[]"][value="2"]')
    await user.click('#lesson-question-1 input[name="answer[]"][value="1"]')
    await user.shouldNotSeeText('Q#2 incorrect');
    await user.wait(50);
    await user.clickText('Submit answer', { context: '#lesson-question-1'});
    await user.shouldSeeElement('#lesson-question-1.correct');

    await user.clickText('Finish quiz');

    await user.log('Ranking question');
    await user.shouldSeeText('Q#3 Ranking');
    await user.shouldSeeText('Rearrange the answers');
    await user.shouldNotSeeText('Q#3 incorrect');
    if (await user.getElementsBySelector('#lesson-quiz-2 [order="0"] ~ [order="1"]')) {
      await user.log('Shuffle it')
      await user.drag('#lesson-quiz-2 [order="0"]')
      await user.drop('#lesson-quiz-2 [order="1"]')
      await user.wait(500);
      await user.clickText('Submit answer', { context: '#lesson-quiz-2'});
      await user.shouldSeeText('Q#3 incorrect');
    }
    await user.drag('#lesson-quiz-2 [order="0"]')
    await user.drop('#lesson-quiz-2 [order="1"]')

    if (await user.getElementsBySelector('#lesson-quiz-2 [order="2"] ~ [order="1"]')) {
      await user.clickText('Submit answer', { context: '#lesson-quiz-2'});
      await user.shouldSeeText('Q#3 incorrect');
      await user.drag('#lesson-quiz-2 [order="2"]')
      await user.drop('#lesson-quiz-2 [order="1"]')
    }
    await user.shouldNotSeeText('Q#3 incorrect', '#lesson-quiz-2');
    await user.shouldSeeElement('#lesson-quiz-2 .button:not([disabled])');
    await user.clickText('Submit answer', { context: '#lesson-quiz-2'});
    await user.shouldNotSeeText('Q#3 incorrect', '#lesson-quiz-2');


    await user.log('Blank question');
    await user.shouldSeeText('Fill in the blank with the correct answer');

    await user.drag('#lesson-quiz-3 li[order="0"]')
    await user.drop('#lesson-quiz-3 .blank[index="0"]')
    //await user.shouldNotSeeText('Submit answer', { context: '#lesson-quiz-3'});
    //await user.shouldSeeText('Q#4 incorrect', '#lesson-quiz-3');
    await user.drag('#lesson-quiz-3 li[order="2"]')
    await user.drop('#lesson-quiz-3 .blank[index="1"]')
    //await user.shouldNotSeeText('Q#4 incorrect', '#lesson-quiz-3');
    await user.clickText('Submit answer', { context: '#lesson-quiz-3'});
    await user.shouldSeeText('Q#4 incorrect', '#lesson-quiz-3');
    await user.click('#lesson-quiz-3 .blank[index="1"] > div')
    await user.shouldNotSeeText('Q#4 incorrect', '#lesson-quiz-3');
    //await user.shouldNotSeeText('Submit answer', 'Submit answer', { context: '#lesson-quiz-3'});
    //await user.shouldSeeText('Q#4 incorrect', '#lesson-quiz-3');
    await user.drag('#lesson-quiz-3 li[order="1"]')
    await user.drop('#lesson-quiz-3 .blank[index="1"]')
    await user.shouldNotSeeText('Q#4 incorrect', '#lesson-quiz-3');
    await user.wait(100);
    await user.clickText('Submit answer', { context: '#lesson-quiz-3'});
    await user.shouldNotSeeText('Q#4 incorrect', '#lesson-quiz-3');



    await user.log('Match question');
    await user.shouldSeeText('Drag the answers into the correct category');

    await user.drag('#lesson-quiz-4 li[order="0"]')
    await user.drop('#lesson-quiz-4 .group[index="Q#5 G#2"]')
    await user.shouldSeeElement('#lesson-quiz-4 .button[disabled]');
    //await user.clickText('Submit answer', { context: '#lesson-quiz-4'});
    //await user.shouldSeeText('Q#5 incorrect', '#lesson-quiz-4');
    await user.drag('#lesson-quiz-4 li[order="0"]')
    await user.drop('#lesson-quiz-4 .group[index="Q#5 G#1"]')
    await user.shouldSeeElement('#lesson-quiz-4 .button[disabled]');
    //await user.clickText('Submit answer', { context: '#lesson-quiz-4'});
    //await user.shouldSeeText('Q#5 incorrect', '#lesson-quiz-4');
    await user.drag('#lesson-quiz-4 li[order="1"]')
    await user.drop('#lesson-quiz-4 .group[index="Q#5 G#1"]')
    await user.shouldSeeElement('#lesson-quiz-4 .button[disabled]');
    //await user.clickText('Submit answer', { context: '#lesson-quiz-4'});
    //await user.shouldSeeText('Q#5 incorrect', '#lesson-quiz-4');
    await user.drag('#lesson-quiz-4 li[order="2"]')
    await user.drop('#lesson-quiz-4 .group[index="Q#5 G#2"]')
    await user.shouldSeeElement('#lesson-quiz-4 .button[disabled]');
    //await user.clickText('Submit answer', { context: '#lesson-quiz-4'});
    //await user.shouldSeeText('Q#5 incorrect', '#lesson-quiz-4');
    await user.drag('#lesson-quiz-4 li[order="3"]')
    await user.drop('#lesson-quiz-4 .group[index="Q#5 G#1"]')
    await user.shouldSeeElement('#lesson-quiz-4 .button:not([disabled])');
    await user.clickText('Submit answer', { context: '#lesson-quiz-4'});
    await user.shouldSeeText('Q#5 incorrect', '#lesson-quiz-4');
    await user.drag('#lesson-quiz-4 li[order="3"]')
    await user.drop('#lesson-quiz-4 .group[index="Q#5 G#2"]')
    await user.clickText('Submit answer', { context: '#lesson-quiz-4'});
    await user.shouldNotSeeText('Q#5 incorrect', '#lesson-quiz-4');

    await user.shouldSeeText('After quiz YEY');
    await user.shouldSeeText('Congratulations!');
    await user.clickText('Back to lesson');
    await user.shouldSeeElement('h1 svg');
    await user.click('[route="lesson"] [name="ChevronLeft"]');
    await user.shouldSeeElement(`[route="course"] #lessons-${lessonId}.checked`);
    await user.shouldSeeText(`completed`, '[route="course"]');
  })
})