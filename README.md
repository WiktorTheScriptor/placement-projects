# placement-projects
collection of my security opencart extension and tampermonkey tool code

The file monitor tool scans through the server files and notifies the admin and emailing list when any changes are detected (run by cron job). it marks change detections with high priority if any malware signatures are found inside the file, or if it is a changed image with encoded php contents.

the extension updater is code for tampermonkey that can be run once logged into an admin opencart marketplace account, with the end result of boosting the user's marketplace extension listing visibility. It does this buy opening the user's listed extensions page, then looping through each item of the page, submitting changes, and looping that for each extension page. it provides a useful interface to pause/start a run and to show the progress of page/item.   
