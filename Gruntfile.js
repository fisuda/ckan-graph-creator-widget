/*!
 *   Copyright 2014-2015 CoNWeT Lab., Universidad Politecnica de Madrid
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */


module.exports = function (grunt) {

    'use strict';

    var fs = require('fs');

    var jshintrc_pre = JSON.parse(fs.readFileSync('.jshintrc', 'utf8'));
    jshintrc_pre.devel = true;

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        bower: {
            install: {
                options: {
                    layout: function (type, component, source) {
                        return type;
                    },
                    targetDir: './build/lib/lib'
                }
            }
        },

        copy: {
            main: {
                files: [
                    {expand: true, cwd: 'src/js', src: '**/*', dest: 'build/src/js'}
                ]
            },
            shared: {
                files: [
                    {expand: true, cwd: 'shared', src: '**/*', dest: 'build/src/shared'}
                ]
            },
            operator: {
                files: [
                    {expand: true, cwd: 'src-operator/js', src: '**/*', dest: 'build/src/js'}
                ]
            }
        },

        strip_code: {
            multiple_files: {
                src: ['build/src/js/**/*.js']
            }
        },

        compress: {
            operator: {
                options: {
                    mode: 'zip',
                    archive: 'dist/<%= pkg.vendor %>_<%= pkg.name %>_operator_<%= pkg.version %>.wgt'
                },
                files: [
                    {
                        expand: true,
                        cwd: 'src-operator',
                        src: [
                            'doc/**/*',
                            'index.html',
                            'config.xml',
                            'DESCRIPTION.md'
                        ]
                    },
                    {
                        expand: true,
                        cwd: 'build/lib',
                        src: [
                            'lib/**/*',
                            '!lib/__untyped__/**'
                        ]
                    },
                    {
                        expand: true,
                        cwd: 'build/src',
                        src: [
                            'js/**/*',
                            'shared/**/*'
                        ]
                    },
                    {
                        expand: true,
                        cwd: '.',
                        src: [
                            'LICENSE'
                        ]
                    }
                ]
            },
            widget: {
                options: {
                    mode: 'zip',
                    archive: 'dist/<%= pkg.vendor %>_<%= pkg.name %>_<%= pkg.version %>.wgt'
                },
                files: [
                    {
                        expand: true,
                        cwd: 'src',
                        src: [
                            'css/**/*',
                            'doc/**/*',
                            'images/**/*',
                            'index.html',
                            'config.xml',
                            'DESCRIPTION.md'
                        ]
                    },
                    {
                        expand: true,
                        cwd: 'build/lib',
                        src: [
                            'lib/**/*'
                        ]
                    },
                    {
                        expand: true,
                        cwd: 'build/src',
                        src: [
                            'js/**/*'
                        ]
                    },
                    {
                        expand: true,
                        cwd: '.',
                        src: [
                            'LICENSE'
                        ]
                    }
                ]
            }
        },

        clean: {
            build: {
                src: ['build']
            },
            temp: {
                src: ['build/src']
            }
        },

        replace: {
            version: {
                overwrite: true,
                src: ['src/config.xml'],
                replacements: [{
                    from: /version=\"[0-9]+\.[0-9]+\.[0-9]+(-dev)?\"/g,
                    to: 'version="<%= pkg.version %>"'
                }]
            },
            versionoperator: {
                overwrite: true,
                src: ['src-operator/config.xml'],
                replacements: [{
                    from: /version=\"[0-9]+\.[0-9]+\.[0-9]+(-dev)?\"/g,
                    to: 'version="<%= pkg.version %>"'
                }]
            }
        },

        jscs: {
            widget: {
                files: {
                    src: 'src/js/**/*'
                },
                options: {
                    config: ".jscsrc"
                }
            },
            shared: {
                files: {
                    src: 'shared/js/**/*'
                },
                options: {
                    config: ".jscsrc"
                }
            },
            operator: {
                files: {
                    src: 'src-operator/js/**/*'
                },
                options: {
                    config: ".jscsrc"
                }
            }
        },

        jshint: {
            pre: {
                options: jshintrc_pre,
                files: {
                    src: ['src/js/**/*.js']
                }
            },
            build: {
                options: {
                    jshintrc: '.jshintrc'
                },
                files: {
                    src: ['src/js/**/*.js']
                }
            },
            shared: {
                options: {
                    jshintrc: '.jshintrc'
                },
                files: {
                    src: ['shared/js/**/*.js']
                }
            },
            operator: {
                options: {
                    jshintrc: '.jshintrc'
                },
                files: {
                    src: ['src-operator/js/**/*.js']
                }
            },
            grunt: {
                options: {
                    jshintrc: '.jshintrc-node'
                },
                files: {
                    src: ['Gruntfile.js']
                }
            },
            test: {
                options: {
                    jshintrc: '.jshintrc-jasmine'
                },
                files: {
                    src: ['src/test/js/**/*.js']
                }
            }
        },

        jasmine: {
            test: {
                src: ['src/js/*.js', '!src/js/main.js'],
                options: {
                    specs: 'src/test/js/*Spec.js',
                    helpers: ['src/test/helpers/*.js'],
                    vendor: ['bower_components/jquery/dist/jquery.js',
                             'node_modules/jasmine-jquery/lib/jasmine-jquery.js',
                             'node_modules/mock-applicationmashup/lib/vendor/mockMashupPlatform.js',
                             'src/test/vendor/*.js']
                }
            },

            coverage: {
                src: '<%= jasmine.test.src %>',
                options: {
                    helpers: '<%= jasmine.test.options.helpers %>',
                    specs: '<%= jasmine.test.options.specs %>',
                    vendor: '<%= jasmine.test.options.vendor %>',
                    template: require('grunt-template-jasmine-istanbul'),
                    templateOptions : {
                        coverage: 'build/coverage/json/coverage.json',
                        report: [
                            {type: 'html', options: {dir: 'build/coverage/html'}},
                            {type: 'cobertura', options: {dir: 'build/coverage/xml'}},
                            {type: 'text-summary'}
                        ]
                    }
                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-bower-task');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks("grunt-jscs");
    grunt.loadNpmTasks('grunt-strip-code');
    grunt.loadNpmTasks('grunt-text-replace');

    grunt.registerTask('test', [
        'bower:install',
        'jshint:grunt',
        'jshint:pre',
        'jshint:test',
        'jscs:widget',
        'jasmine:coverage'
    ]);

    grunt.registerTask('default', [
        'test',
        'jshint:build',
        'clean:temp',
        'copy:main',
        'strip_code',
        'replace:version',
        'compress:widget'
    ]);

    grunt.registerTask('operator', [
        'bower:install',
        'jshint:shared',
        'jscs:shared',
        'jshint:operator',
        'jscs:operator',
        'clean:temp',
        'copy:shared',
        'copy:operator',
        'strip_code',
        'replace:versionoperator',
        'compress:operator'
    ]);
};
