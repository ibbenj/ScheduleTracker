const express = require("express")

const app = express()
app.use(express.json())
const schedules= new Map()
const tasksList= new Map()//map of all the taskslists maps

app.get("/", (req, res) => {
    res.json({a:"4"})
})

//ADDS SCHEDULE
app.post("/schedule", async (req,res) => {
    const data= req.body //recieves inputted json object
    const scheduleId= schedules.size //e.g. if size is 2, then set its index value to 2 (clever)
    const schedule= {name: data.name, id: scheduleId, tasks: []}//[] for array
    schedules.set(scheduleId,schedule)

    const tasks= new Map()
    const tasksListId= tasksList.size
    tasksList.set(tasksListId,tasks)

    res.json(schedule)
})

//ADD TASK TO GIVEN SCHEDULE
app.post("/schedule/:scheduleId/task", async (req,res) => {//ADD: make it check to ensure task doesn't already exist
    const data= req.body
    
    const dateDueString= data.dateDue
    //console.log(dateDueString)
    const dateDueArr= dateDueString.split("/")
    const dateDue= new Date()
    //console.log("date due arr: "+dateDueArr + "first object: "+dateDueArr[0])
    //dateDue.setUTCFullYear(2002,5,5)
    dateDue.setUTCFullYear(parseInt(dateDueArr[2]),parseInt(dateDueArr[0])-1,parseInt(dateDueArr[1]))
    //console.log("date due: "+dateDueArr+" parseInt: "+parseInt(dateDueArr[2]))

    const scheduleId= parseInt(req.params.scheduleId)
    const tasks= tasksList.get(scheduleId)
    var dateCreated= new Date()

    //("date created: "+dateCreated)

    const taskId= tasks.size //make one for each schedule
    const task= {name: data.name, id: taskId, description: data.description, isCompleted: data.isCompleted, dateCreated: dateCreated, dateDue: dateDue} //left out datecrated/due and subtasks
    tasks.set(taskId,task)
    
    tasksList.set(scheduleId,tasks)

    res.json(task)    
})

//RETURNS VALUE OF CERTAIN TASK
app.get("/schedule/:scheduleId/task/:taskId", async (req,res) => {
    const data= req.body
    const taskId= parseInt(req.params.taskId)
    const scheduleId= parseInt(req.params.scheduleId)
    const tasks= tasksList.get(scheduleId)
    const task= tasks.get(taskId)
    //console.log("TASK DUE DATE: "+task.dateDue)
    res.json(task)
})

//DELETED TASK OF GIVEN ID
app.delete("/schedule/:scheduleId/deleteId/:taskId", async (req,res) => { //doesn't readjust ids of tasks, unlike some later functions
    const scheduleId= parseInt(req.params.scheduleId)
    const taskId= parseInt(req.params.taskId)

    const tasks= tasksList.get(scheduleId)
    tasks.delete(taskId)
    tasksList.set(scheduleId,tasks)

    res.json({ message: "task 'deleted' successfuly" })
})

//DELETES ALL COMPLETED TASKS OF A GIVEN SCHEDULE
app.delete("/schedule/:scheduleId/deleteCompletedTasks", async (req,res) => {
    const scheduleId= parseInt(req.params.scheduleId)
    const tasks= tasksList.get(scheduleId)
    console.log("DELETE COMPLETED TASKS")

    const newTaskList= new Map()

    num= 0
    for(i=0;i<tasks.size;i++){
        const curTask= tasks.get(i)
        if(curTask.isCompleted=="False"){
            curTask.id= num
            newTaskList.set(num,curTask)
            num++
            //console.log("YEAH: "+curTask.isCompleted)
        }
        else{
            //console.log("NOPE: "+curTask.isCompleted)
        }
    }

    tasksList.set(scheduleId,newTaskList)

    res.json({ message: "completed tasks 'deleted' successfuly" })
})

//DELETES TASK OF GIVEN NAME
app.delete("/schedule/:scheduleId/deleteName/:taskName", async (req,res) => {
    const scheduleId= parseInt(req.params.scheduleId)
    const taskName= req.params.taskName
    const tasks= tasksList.get(scheduleId)

    for(i=0;i<tasks.size;i++){
        const task= tasks.get(i)
        if(task.name==taskName){
            //tasks.delete(task)

            //make new map & deep copy it
            const tasksRemoved= new Map()
            for(j=0;j<i;j++){
                tasksRemoved.set(j,tasks.get(j))
            }
            for(j=i+1;j<tasks.size;j++){
                tasksRemoved.set(j-1,tasks.get(j))
            }

            for(j=0;j<tasksRemoved.size;j++){
                tasks.set(j,tasksRemoved.get(j))
            }
            //tasks.delete(tasks.size-1)
            tasksList.set(scheduleId,tasksRemoved)

            //tasksList.set(scheduleId,tasks)
            res.json({message: "task "+ taskName +" successfuly deleted"})
        }
    }
})

//DELETE SCHEDULE OF 'scheduleId'
app.delete("/schedule/:scheduleId/delete", async(req,res) => {
    const scheduleId= parseInt(req.params.scheduleId)
    tasksList.delete(scheduleId)
    res.json({ message: "task 'deleted' successfuly" })
})

//DISPLAYS TASKS FOR THIS WEEK
app.get("/schedule/:scheduleId/thisWeek", async (req,res) => { //make sure the object it returns actually contains stuff
    const today= new Date()
    const todayPlusWeek= new Date()
    todayPlusWeek.setDate(today.getDate() + 7)
    //console.log("TODAYPLUS wEEK: "+todayPlusWeek)

    const scheduleId= parseInt(req.params.scheduleId)
    const tasks= tasksList.get(scheduleId)
    for(i=0;i<tasks.size;i++){
        const task= tasks.get(i)
        //console.log("task.dateDue: "+task.dateDue + " today: "+today+" todayPlusWeek: "+todayPlusWeek)
        if(!(task.dateDue >= today && task.dateDue <= todayPlusWeek)){
            //console.log("NOT DISPLAYING: "+task.dateDue)
            tasks.delete(task)
        }
    }
    res.json("TASKS FOR THIS WEEK: "+{tasks: [...tasks]})
})

//UPDATES A SPECIFIC FIELD OF A SPECIFIC TASK
app.patch("/schedule/:scheduleId/update/:updateType/:taskName/:newValue", async (req,res) => {//haven't tested this request yet
    const scheduleId= parseInt(req.params.scheduleId)
    const taskName= req.params.taskName
    const updateType= req.params.updateType
    const newValue= req.params.newValue
    const tasks= tasksList.get(scheduleId)

    for(i=0;i<tasks.size;i++){
        const task= tasks.get(i)
        console.log(task.name+" :: "+taskName)
        if(task.name==taskName){
            //modify
            switch(updateType){
                case "name":
                    console.log("old task name: "+task.name)
                    task.name= newValue
                    console.log("new task name: "+task.name)
                    break
                case "description":
                    console.log("THIS SHOULDN'T WORK")
                    task.description= newValue
                    break
                case "isCompleted":
                    task.isCompleted= newValue
                    break
                case "dateDue":
                    task.dateDue= newValue
                    break
                default:
                    console.error("ERROR: Invalid 'updateType' given")
            }

            tasks.set(i,task)
            tasksList.set(scheduleId,tasks)
            res.json(task)
        }

    }
})

//SORTS TASKLIST BY EITHER NAME, ID OR DUEDATE
app.patch("/schedule/:scheduleId/sort/:sortType", async (req,res) => {//test
    const scheduleId= parseInt(req.params.scheduleId)
    const sortType= req.params.sortType
    const tasks= tasksList.get(scheduleId)
    console.log(sortType+" SORT TYPE")
    switch(sortType){
        case "name": //sort by name (lexiographically)
            console.log("LET'S START")
            for(i=0;i<tasks.size-1;i++){
                maxIn= i
                for(j=i+1;j<tasks.size;j++){
                    console.log(tasks.get(j).name+" < "+tasks.get(maxIn).name)
                    if(tasks.get(j).name<tasks.get(maxIn).name){
                        console.log("YES")
                        maxIn= j
                    }
                }
                const tempTask= tasks.get(i)
                tasks.set(i,tasks.get(maxIn))
                tasks.set(maxIn,tempTask)
            }
            break
        case "taskId": //sort by taskId
            for(i=0;i<tasks.size-1;i++){
                maxIn= i
                for(j=i+1;j<tasks.size;j++){
                    if(tasks.get(j).taskId<tasks.get(maxIn).taskId){
                        maxIn= j
                    }
                }
                const tempTask= tasks.get(i)
                tasks.set(i,tasks.get(maxIn))
                tasks.set(maxIn,tempTask)
            }
            break
        case "dueDate": //sort by due date
            for(i=0;i<tasks.size-1;i++){
                maxIn= i
                for(j=i+1;j<tasks.size;j++){
                    if(tasks.get(j).dueDate<tasks.get(maxIn).dueDate){
                        maxIn= j
                    }
                }
                const tempTask= tasks.get(i)
                tasks.set(i,tasks.get(maxIn))
                tasks.set(maxIn,tempTask)
            }
            break
        default:
            console.error("ERROR: Invalid 'sortType' given")
    }

    //reset taskIds to new order
    for(i=0;i<tasks.length;i++){
        curTask= tasks.get(i)
        curTask.taskId= i
        tasks.set(i,curTask)
    }

    tasksList.set(scheduleId,tasks)
    res.json(tasksList)
})

//MERGES TWO SCHEDULES TOGETHER
app.patch("/schedule/:scheduleId1/:scheduleId2/merge", async(req,res) =>{
    const scheduleId1= parseInt(req.params.scheduleId1)
    const scheduleId2= parseInt(req.params.scheduleId2)
    const schedule1= tasksList.get(scheduleId1)
    const schedule2= tasksList.get(scheduleId2)
    const size1= schedule1.size

    for(i=0;i<schedule2.size;i++){
        const curTask= schedule2.get(i)
        curTask.id= i+size1
        console.log(i+" || "+curTask.id)
        schedule1.set(curTask.id,curTask)
    }

    tasksList.set(scheduleId1,schedule1)
    tasksList.delete(scheduleId2)
    res.json(tasksList)
})

app.listen(8080)

/*
//read up on routers - use link to simply code? https://medium.com/better-programming/express-js-routing-1b48f459d43a
//work on backend - more features
//Doccumentaiton: http://expressjs.com/en/api.html#express.json
//Maps: https://javascript.info/map-set, https://www.javascripttutorial.net/es6/javascript-map/
//req.params: https://stackoverflow.com/questions/8506658/node-js-express-routing-with-get-params
*/
//node src/index.js