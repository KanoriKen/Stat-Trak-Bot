const {exec} = require('child_process');
const currentDate = new Date();

const backupCommand = `sqlite3 /home/ubuntu/scarlet-bot/storage/stats.db ".backup /home/ubuntu/scarlet-bot/storage/backups/backup_${currentDate.toISOString()}.db"`;

exec(backupCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Backup failed: ${stderr}`);
  } else {
    console.log(`Backup successful: backup_${currentDate.toISOString()}.db`);
  }
});