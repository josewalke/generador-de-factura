module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js', '**/__tests__/**/*.js'],
    collectCoverageFrom: [
        'controllers/**/*.js',
        'services/**/*.js',
        'routes/**/*.js',
        'middlewares/**/*.js',
        '!**/node_modules/**',
        '!**/tests/**'
    ],
    coverageDirectory: 'coverage',
    verbose: true,
    testTimeout: 10000
};



