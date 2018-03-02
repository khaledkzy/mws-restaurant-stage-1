module.exports = function (grunt) {
  grunt.initConfig({
    responsive_images: {
      dev: {
        options: {
          engine: 'gm',
          sizes: [{
            width: 240,
            suffix: '_small_2x',
            quality: 20
          }, {
            width: 480,
            suffix: '_medium_1x',
            quality: 40
          }, {
            width: 720,
            suffix: '_large_2x',
            quality: 60
          }]
        },

        files: [{
          expand: true,
          src: ['*.{gif,jpg,png}'],
          cwd: 'img/',
          dest: 'images_responsive/'
        }]
      }
    },
  });
  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.registerTask('default', ['responsive_images']);
};
