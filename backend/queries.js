const {Pool} = require('pg')
const bcrypt = require("bcryptjs");

//protocol://DBusername:DBpassword@localhost:5432/DBname
var connString = (process.env.PORT)? process.env.DATABASE_URL : 'postgresql://me:password@localhost:5432/api';

const pool = new Pool({
	connectionString: connString,
	ssl:true,
})

function getStudentGrade(email){
	return pool.query(`SELECT SUM(response_grade)/COUNT(*) AS total FROM takes JOIN rubric ON rubric.section_id=takes.section_id JOIN prompt ON prompt.rubric_id=rubric.rubric_id JOIN question ON prompt.prompt_id=question.prompt_id JOIN response ON response.question_id=question.question_id JOIN evaluation ON evaluation.response_id=response.response_id WHERE student_id='${email}'`);

}

function getStudentResponse(rId){
	return pool.query(`SELECT * FROM response WHERE response_id='${rId}'`);
}
function createProfEval(email, resId, grade) {
	return pool.query(`INSERT INTO prof_eval(professor_email, response_id, response_grade) VALUES ('${email}','${resId}', '${grade}') RETURNING *`);
}
function getAssignment(rub_id){
	return pool.query(`SELECT DISTINCT p.*, q.* FROM rubric r JOIN prompt p ON r.rubric_id=p.rubric_id JOIN question q ON p.prompt_id=q.prompt_id WHERE r.rubric_id='${rub_id}'`);
}
function deleteRubric(rub_id){
	return pool.query(`DELETE FROM rubric WHERE rubric_id='${rub_id}'`);
}

async function createRubric(assigned_date, due_date, final_due_date, assignment){
	
	let result;
	await pool.query(`INSERT INTO rubric(assigned_date, due_date, final_due_date) 
						VALUES (to_timestamp('${assigned_date}'),to_timestamp('${due_date}'),to_timestamp('${final_due_date}')) RETURNING *`)
			.then((resultRubric) => {
					result = resultRubric;
					assignment.prompts.forEach((prompt) => {createPrompt(resultRubric.rows[0].rubric_id, prompt.prompt, prompt.questions)});
				});
	return result;

}
function createPrompt(rub_id, prompt_txt, questions){
	return pool.query(`INSERT INTO prompt(rubric_id, prompt_text) VALUES ('${rub_id}','${prompt_txt}') RETURNING *`)
				.then((resultPrompt) => {
						return questions.forEach((q) => {createQuestion(resultPrompt.rows[0].prompt_id, q.question, q.min_char)});
					});

}
function createQuestion(prompt_id, question_txt, min_char){
	return pool.query(`INSERT INTO question(question_text, prompt_id, min_char) VALUES ('${question_txt}','${prompt_id}', '${min_char}') RETURNING *`);
}
function connectSectionRubric(sec_id, rub_id){
	return pool.query(`INSERT INTO section_rubric(section_id, rubric_id) VALUES ('${sec_id}','${rub_id}') RETURNING *`);
}
function getClassSections(class_id){
	return pool.query(`SELECT * FROM class c JOIN section s ON c.class_id=s.class_id WHERE c.class_id='${class_id}'`);
}
function getClass(class_id){
	return pool.query(`SELECT * FROM class WHERE class.class_id='${class_id}'`);
}
function getAllClassAssignments(class_id){
	return pool.query(`SELECT DISTINCT r.* FROM section s JOIN section_rubric sr ON s.section_id=sr.section_id JOIN rubric r ON sr.rubric_id=r.rubric_id WHERE s.class_id='${class_id}'`);
}
function createClass(email, name){
	return pool.query(`INSERT INTO class(professor_email, name) VALUES ('${email}','${name}') RETURNING *`);
}
function createSection(class_id){
	return pool.query(`INSERT INTO section(class_id) VALUES ('${class_id}') RETURNING *`);
}

function getStudByEmail(email){
	return pool.query(`SELECT * FROM student WHERE student.email='${email}'`);
}

function takesCheck(email, sectionID){
	return pool.query(`SELECT student_id FROM takes WHERE student_id='${email}' AND section_id='${sectionID}'`);
}

function getAssignRubric(sectionID){
	return pool.query(`SELECT * FROM rubric WHERE rubric.section_id='${sectionID}' AND rubric.due_date >= NOW()`);
}

function getAssignment(rubricID){		
	return pool.query(`SELECT prompt.prompt_id, prompt_text, question_text, min_char FROM prompt INNER JOIN question ON prompt.rubric_id='${rubricID}' AND prompt.prompt_id=question.prompt_id`);
}

function getEvalAssignment(email){
	return pool.query(`SELECT evaluation_id, prompt_text, question_id, question_text, response_id, response_value FROM evaluation INNER JOIN response ON evaluation.student_email='${email}' AND evaluation.response_id=response.response_id INNER JOIN question ON response.question_id=question.question_id INNER JOIN prompt ON question.prompt_id=prompt.prompt_id`);
}

async function submitAssignment(email, assignment){
	let result = await assignment.responses.forEach((res) => {
		return pool.query(`INSERT INTO response (response_id, student_email, response_value, question_id) VALUES (DEFAULT, '${email}', '${res.response}', '${res.qsID}') RETURNING *`);
	});
	return result;
}

async function submitEvalGrade(assignment){
	let result = await assignment.evaluation.forEach((eval) => {
		return pool.query(`UPDATE evaluation SET response_grade='${eval.grade}' WHERE eval_id='${eval.evaluationID}' RETURNING *`);
	});
	return result;
}

function studRegClass(email, sectionID){
	return pool.query(`INSERT INTO takes (student_id, section_id) VALUES ('${email}','${sectionID}') RETURNING *`);
}

function studRemoveClass(email, sectionID){
	return pool.query(`DELETE FROM takes WHERE student_id='${email}' AND section_id='${sectionID}' RETURNING *`);
}

function addStudent(name, email, password){
	return new Promise( (onSuccess, onFail) => {
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(password, salt, (err, hash) => {
				if(err) onFail(err);
				pool.query(`INSERT INTO student(name, email, password, date) VALUES ('${name}', '${email}', '${hash}', NOW())`)
					.then( () =>{
						getStudByEmail(email).then((result) => onSuccess(result));
					})
					.catch((error) => { onFail(error)} );
			});
		});
	});
}

function getProfByEmail(email){
	return pool.query(`SELECT * FROM professor WHERE professor.email='${email}'`);
}

function addProfessor(name, email, password){
	return new Promise( (onSuccess, onFail) => {
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(password, salt, (err, hash) => {
				if(err) onFail(err);
				pool.query(`INSERT INTO professor(name, email, password, date) VALUES ('${name}', '${email}', '${hash}', NOW())`)
					.then( () =>{
						getProfByEmail(email).then((result) => onSuccess(result));
					})
					.catch((error) => { onFail(error)} );
			});
		});
	});
}


function updateProfessor(name, email, password){
	if(password){
		return new Promise( (onSuccess, onFail) => {
			bcrypt.genSalt(10, (err, salt) => {
				bcrypt.hash(password, salt, (err, hash) => {
					if(err) onFail(err);
					pool.query(`UPDATE professor SET name='${name}', password='${hash}' WHERE email='${email}'`)
						.then(result => onSuccess(result))
						.catch((error) => { onFail(error)} );
				});
			});
		});
	}
	return new Promise( (onSuccess, onFail) => {
		pool.query(`UPDATE professor SET name='${name}' WHERE email='${email}'`)
			.then(result => onSuccess(result))
			.catch((error) => { onFail(error)} );
	});
}

function updateStudent(name, email, password){
	if(!email) return new Error("Server Error");

	if(password && name){
		return new Promise( (onSuccess, onFail) => {
			bcrypt.genSalt(10, (err, salt) => {
				bcrypt.hash(password, salt, (err, hash) => {
					if(err) onFail(err);
					pool.query(`UPDATE student SET name='${name}', password='${hash}' WHERE email='${email}'`)
						.then(result => onSuccess(result))
						.catch((error) => { onFail(error)} );
				});
			});
		});
	}
	if(password){
		return new Promise( (onSuccess, onFail) => {
			bcrypt.genSalt(10, (err, salt) => {
				bcrypt.hash(password, salt, (err, hash) => {
					if(err) onFail(err);
					pool.query(`UPDATE student SET password='${hash}' WHERE email='${email}'`)
						.then(result => onSuccess(result))
						.catch((error) => { onFail(error)} );
				});
			});
		});
	}
	return new Promise( (onSuccess, onFail) => {
		pool.query(`UPDATE student SET name='${name}' WHERE email='${email}'`)
			.then(result => onSuccess(result))
			.catch((error) => { onFail(error)} );
	});
}

module.exports = {
	takesCheck,
	studRegClass,
	studRemoveClass,
	submitEvalGrade,
	getEvalAssignment,
	submitAssignment,
	getAssignRubric,
	getAssignment,
	getStudByEmail,
	getStudentGrade,
	addStudent,
	getProfByEmail,
	addProfessor,
	updateProfessor,
	updateStudent,
	getClassSections,
	getClass,
	getAllClassAssignments,
	createClass,
	createSection,
	createRubric,
	connectSectionRubric,
	deleteRubric,
	getAssignment,
	getStudentResponse,
	createProfEval,
}
