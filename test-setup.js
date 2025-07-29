#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 AI Health Management System - Setup Verification\n');

// Check if required files exist
const requiredFiles = [
  'package.json',
  'backend/package.json',
  'frontend/package.json',
  'backend/.env.example',
  'backend/server.js',
  'frontend/src/App.js',
  'README.md'
];

console.log('📁 Checking required files...');
let missingFiles = [];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log(`\n❌ Missing ${missingFiles.length} required files. Please ensure all files are created.`);
  process.exit(1);
}

// Check Node.js version
console.log('\n🔧 Checking Node.js version...');
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion >= 16) {
    console.log(`✅ Node.js ${nodeVersion} (>= 16.0.0)`);
  } else {
    console.log(`❌ Node.js ${nodeVersion} - Please upgrade to Node.js 16 or higher`);
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Node.js not found. Please install Node.js 16 or higher.');
  process.exit(1);
}

// Check npm version
console.log('\n📦 Checking npm version...');
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`✅ npm ${npmVersion}`);
} catch (error) {
  console.log('❌ npm not found. Please install npm.');
  process.exit(1);
}

// Check if MySQL is available (optional)
console.log('\n🗄️  Checking MySQL availability...');
try {
  execSync('mysql --version', { encoding: 'utf8', stdio: 'pipe' });
  console.log('✅ MySQL is available');
} catch (error) {
  console.log('⚠️  MySQL not found in PATH. Please ensure MySQL is installed and accessible.');
}

// Check package.json scripts
console.log('\n📋 Checking package.json scripts...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['dev', 'server', 'client', 'test', 'install-deps'];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`✅ Script: ${script}`);
    } else {
      console.log(`❌ Script: ${script} - MISSING`);
    }
  });
} catch (error) {
  console.log('❌ Error reading package.json');
}

// Check backend dependencies
console.log('\n🔧 Checking backend dependencies...');
try {
  const backendPackageJson = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  const requiredDeps = ['express', 'mysql2', 'sequelize', 'bcryptjs', 'jsonwebtoken'];
  
  requiredDeps.forEach(dep => {
    if (backendPackageJson.dependencies && backendPackageJson.dependencies[dep]) {
      console.log(`✅ Backend: ${dep}`);
    } else {
      console.log(`❌ Backend: ${dep} - MISSING`);
    }
  });
} catch (error) {
  console.log('❌ Error reading backend/package.json');
}

// Check frontend dependencies
console.log('\n⚛️  Checking frontend dependencies...');
try {
  const frontendPackageJson = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
  const requiredDeps = ['react', 'react-dom', 'react-router-dom', '@mui/material', 'axios'];
  
  requiredDeps.forEach(dep => {
    if (frontendPackageJson.dependencies && frontendPackageJson.dependencies[dep]) {
      console.log(`✅ Frontend: ${dep}`);
    } else {
      console.log(`❌ Frontend: ${dep} - MISSING`);
    }
  });
} catch (error) {
  console.log('❌ Error reading frontend/package.json');
}

// Check environment file
console.log('\n🔐 Checking environment configuration...');
if (fs.existsSync('backend/.env')) {
  console.log('✅ backend/.env exists');
  
  try {
    const envContent = fs.readFileSync('backend/.env', 'utf8');
    const requiredEnvVars = ['DB_NAME', 'DB_USER', 'JWT_SECRET', 'PORT'];
    
    requiredEnvVars.forEach(envVar => {
      if (envContent.includes(`${envVar}=`)) {
        console.log(`✅ Environment variable: ${envVar}`);
      } else {
        console.log(`❌ Environment variable: ${envVar} - MISSING`);
      }
    });
  } catch (error) {
    console.log('❌ Error reading .env file');
  }
} else {
  console.log('⚠️  backend/.env not found. Copy from backend/.env.example and configure.');
}

console.log('\n🎉 Setup verification complete!');
console.log('\n📝 Next steps:');
console.log('1. Configure your MySQL database');
console.log('2. Update backend/.env with your database credentials');
console.log('3. Run: npm run install-deps');
console.log('4. Run: npm run dev');
console.log('5. Visit: http://localhost:3000');

console.log('\n📚 For detailed instructions, see README.md');
