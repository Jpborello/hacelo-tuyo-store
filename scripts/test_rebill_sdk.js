try {
    console.log('Requiring rebill...');
    const Rebill = require('rebill');
    console.log('Rebill export type:', typeof Rebill);
    console.log('Rebill keys:', Object.keys(Rebill));
    if (typeof Rebill === 'function') {
        console.log('Rebill is a function/class');
    }
} catch (error) {
    console.error('Error requiring rebill:', error);
}
