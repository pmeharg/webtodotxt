var defaultFilters = {
    text: '',
    completed: 'all',
    completion_date: null,
    priorities: [],
    creation_date: '',
    projects: [],
    contexts: []
};

var app = new Vue({
    delimiters: ['${', '}'], // Because Jinja2 already uses double brakets
    el: '#app',
    data: {
        loading: false, // Something is loading

        // New todo creation
        todoTextBackup: null,
        todoBeingEdited: null,

        todos: [], // List of all todos straight from the Todo.txt
        filters: defaultFilters // Filters used to filter the todo list above
    },
    // When Vue is ready
    mounted: function () {
        this.$nextTick(function () {
            app.loadTodoTxt();
        });
    },
    watch: {
        /*todos: function() {
            // https://vuejs.org/v2/guide/computed.html#Watchers
            // http://stackoverflow.com/questions/5226578/check-if-a-timeout-has-been-cleared
        }*/
    },
    computed: {
        // The todo list, filtered according filters
        filteredTodos: function () {
            return this.todos.filter(function (todo) {
                if (('text' in todo) && app.filters.text) {
                    return todo.text.indexOf(app.filters.text) !== -1;
                }

                if (('completed' in todo) && app.filters.completed == 'yes') {
                    return todo.completed;
                } else if (('completed' in todo) && app.filters.completed == 'no') {
                    return !todo.completed;
                }

                if (('completion_date' in todo) && app.filters.completion_date) {
                    return app.filters.completion_date == todo.completion_date;
                }

                if (('priority' in todo) && app.filters.priorities && app.filters.priorities.length > 0) {
                    return $.inArray(todo.priority, app.filters.priorities) !== -1;
                }

                if (('creation_date' in todo) && app.filters.creation_date) {
                    return app.filters.creation_date == todo.creation_date;
                }

                if (('projects' in todo) && todo.projects && app.filters.projects && app.filters.projects.length > 0) {
                    return $.grep(todo.projects, function(project) {
                        return $.inArray(project, app.filters.projects) !== -1;
                    }).length > 0;
                }

                if (('contexts' in todo) && todo.contexts && app.filters.contexts && app.filters.contexts.length > 0) {
                    return $.grep(todo.contexts, function(context) {
                        return $.inArray(context, app.filters.contexts) !== -1;
                    }).length > 0;
                }

                return true;
            });
        },
        // All priorities extracted from the current todo list
        allPriorities: function() {
            var all_priorities = [];

            return $.map(this.todos, function(todo) {
                if (!('priority' in todo) || !todo.priority || $.inArray(todo.priority, all_priorities) !== -1) {
                    return null;
                }

                all_priorities.push(todo.priority);

                return todo.priority;
            });
        },
        // All projects extracted from the current todo list
        allProjects: function() {
            var all_projects = [];

            return $.map(this.todos, function(todo) {
                if (!('projects' in todo) || !todo.projects) {
                    return null;
                }

                return $.map(todo.projects, function(project) {
                    if ($.inArray(project, all_projects) !== -1) {
                        return null;
                    }

                    all_projects.push(project);

                    return project;
                });
            });
        },
        // All contexts extracted from the current todo list
        allContexts: function() {
            var all_contexts = [];

            return $.map(this.todos, function(todo) {
                if (!('contexts' in todo) || !todo.contexts) {
                    return null;
                }

                return $.map(todo.contexts, function(context) {
                    if ($.inArray(context, all_contexts) !== -1) {
                        return null;
                    }

                    all_contexts.push(context);

                    return context;
                });
            });
        }
    },
    methods: {
        // Reset all filters
        clearFilters: function() {
            this.filters = defaultFilters;
        },
        addTodo: function() {
            new_todo = {};

            this.todos.unshift(new_todo);
            this.editTodo(new_todo);
        },
        editTodoText: function (todo) {
            this.todoTextBackup = todo.text;
            this.todoBeingEdited = todo;
        },
        doneEditTodoText: function (todo) {
            if (!this.todoBeingEdited) {
                return;
            }

            this.todoBeingEdited = null;

            todo.text = $.trim(todo.text);

            if (!todo.text) {
                this.removeTodo(todo);
            }
        },
        cancelEditTodoText: function (todo) {
            todo.text = this.todoTextBackup;

            this.todoTextBackup = null;
            this.todoBeingEdited = null;
        },
        // Delete a todo
        removeTodo: function (todo) {
            this.todos.splice(this.todos.indexOf(todo), 1);
        },
        // Load all todos from the Todo.txt file
        loadTodoTxt: function() {
            this.loading = true;

            $.ajax({
                type: 'GET',
                url: ROOT_URL + 'todo.txt',
                dataType: 'json',
                cache: false,
                success: function(response, status, xhr) {
                    if (response.status == 'success') {
                        app.todos = response.data;
                    } else {
                        alert(response.data.message);
                    }
                },
                error: function(xhr, errorType, error) {
                    try {
                        var response = JSON.parse(xhr.responseText);
                        message = response.data.message;
                    } catch (e) {
                        message = error;
                    }

                    alert('Error while loading the Todo.txt file: ' + message);
                },
                complete: function() {
                    app.loading = false;
                }
            });
        },
        // Save all todos in the Todo.txt file
        saveTodoTxt: function() {
            this.loading = true;

            $.ajax({
                type: 'POST',
                url: ROOT_URL + 'todo.txt',
                contentType: 'application/json',
                data: JSON.stringify(app.todos),
                success: function(response, status, xhr) {
                    if (response.status != 'success') {
                        alert(response.data.message);
                    }
                },
                error: function(xhr, errorType, error) {
                    try {
                        var response = JSON.parse(xhr.responseText);
                        message = response.data.message;
                    } catch (e) {
                        message = error;
                    }
                    
                    alert('Error while updating the Todo.txt file: ' + message);
                },
                complete: function() {
                    app.loading = false;
                }
            });
        }
    }
});