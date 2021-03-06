# NODE_CTF - A Node/Express JS CTF Scoreboard
![Alt text](https://github.com/chrisjd20/node_ctf/blob/master/optional/new.gif?raw=true "ScreenShot")</br>

NODE_CTF is a CTF scoreboard for more offensive based CTF's. This uses jquery , node, and express. However, this could be used for any type of ctf as it allows generic questions and answers to be put in along with questions/hints. I created this because I felt like I couldn't find any CTF scoreboard that fit my needs. I also did this to learn node a bit better and took me about 6 days. Enjoy!

Made with node v6.9.1 and tested in Windows 7 / 8</br>

#FEATURES:
1. User Registration</br>
2. Toggle Registration on/off</br>
2. Flags submission</br>
3. Trivia questions which unlock hints</br>
4. Nav panel</br>
5. Targets Panel which displays a root and limited flag. Changes colors on capturing flags</br>
6. Leader Scoreboard (of course!)</br>
7. News feed ticker ( collapses on click)  (lets you know what other people are up to and allows admins to send messages)</br>
8. Custom Avatars and coloring for team/user profiles.</br>
9. Account management Panel</br>
10. Admin Panel for managing users, creating flags, sending news to everyone, downloading log data</br>
11. LOGGING (optional - off by default) ! It is a hacking ctf scoreboard after all. This way you can keep an eye on an suspicious activity against the site.</br>
12. Efficiency - NODE_CTF uses clustering and sql pooling to increase performance and handle large loads

#HOW TO RUN
1. Install</br>
2. cd to root dir</br>
3. run "node app.js"</br>

#INSTALLATION
1. git clone https://github.com/chrisjd20/node_ctf.git</br>
2. npm install</br>
3. Change values on lines 44-50 to reflect your system and db info</br>
4. node app.js    <----- This starts the server</br>


#IMPORTANT
1. Default creds are admin/admin. Change this asap
2. Be careful who has access to the admin account. There is minimal input filtering for admin as of right now though regular users should be fairly locked down. Ex - Admin is the only one with access to post custom messages to the news feed. script tags etc...
3. Other than that, should be fairly secure. If you find any issues, please email me at admin (at) hackitlab . com

#SCREENSHOTS
![Alt text](https://github.com/chrisjd20/node_ctf/blob/master/optional/node.PNG?raw=true "ScreenShot")
![Alt text](https://github.com/chrisjd20/node_ctf/blob/master/optional/admin.PNG?raw=true "ScreenShot")
![Alt text](https://github.com/chrisjd20/node_ctf/blob/master/optional/targets.PNG?raw=true "ScreenShot")
![Alt text](https://github.com/chrisjd20/node_ctf/blob/master/optional/home.PNG?raw=true "ScreenShot")
![Alt text](https://github.com/chrisjd20/node_ctf/blob/master/optional/score.PNG?raw=true "ScreenShot")
![Alt text](https://github.com/chrisjd20/node_ctf/blob/master/optional/register.PNG?raw=true "ScreenShot")

