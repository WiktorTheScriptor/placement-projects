// ==UserScript==
// @name         OC Extension Updater
// @namespace    antropy
// @version      1.0.0
// @description  Internal OpenCart extension marketplace refresher, for improving listing visibility
// @author       Antropy - Wiktor Wrazka
// @match        https://www.opencart.com/index.php*
// @grant        none
// ==/UserScript==

// use &reset=1 parameter to restart run, use after crash, paused run, etc
// resets previously set sessionStorage flags

// use test parameter in url for better testing:
// test=1 for testing main list page loop (only one edit url per page)
// test=2 to just test single module edit


(function () {
    'use strict';

    function run() {

        console.log("OC Extension Updater loaded");

        createStatusPanel();




        const url = new URL(window.location.href);
        let test = url.searchParams.get('test');
        if (test) {
            sessionStorage.setItem('ocUpdaterTest', test);
        }
        test = sessionStorage.getItem('ocUpdaterTest');

        // reset flag, for fresh run
        if (url.searchParams.get('reset') === '1') {
            Object.keys(sessionStorage)
                .filter(key => key.startsWith('ocUpdater'))
                .forEach(key => sessionStorage.removeItem(key));
            url.searchParams.delete('reset');
            window.location.href = url.toString();
            return;
        }

        if (sessionStorage.getItem('ocUpdaterStopped') === 'true') {
            return;
        }


        // only run for account/extension url, and see if this is navigation
        // or edit page
        const route = url.searchParams.get('route');
        if (route === 'account/extension') {
            // Marketplace/list-page code

            // checks if currently in a loop through the pages, else
            // for fresh load, will jump to page 1 before starting loop
            const hasStarted = sessionStorage.getItem('ocUpdaterStarted');
            if (!hasStarted) {
                sessionStorage.setItem('ocUpdaterStarted', 'true');
                url.searchParams.delete('page');
                window.location.href = url.toString();
                return;
            }

            // if starting edit loop through list:
            const batchStarted = sessionStorage.getItem('ocUpdaterBatchStarted');
            if (!batchStarted) {
                sessionStorage.setItem('ocUpdaterBatchStarted', 'true');

                // find current and final page numbers
                const pagination = document.querySelector('.pagination');

                // final page number (may break with high number?)
                const pageItems = pagination.querySelectorAll('li');
                let lastPage = 1;
                pageItems.forEach(item => {
                    const page = parseInt(item.textContent.trim(), 10);

                    if (!isNaN(page) && page > lastPage) {
                        lastPage = page;
                    }
                });

                // if test=2 (only run 1st page, 1st module
                if (test === '2') {
                    lastPage = 1;
                }

                const currentPage = parseInt(
                    pagination.querySelector('li.active').textContent.trim(), 10
                );

                sessionStorage.setItem('ocUpdaterLastPage', String(lastPage));
                sessionStorage.setItem('ocUpdaterCurrentPage', String(currentPage));

                console.log(`Last page: ${lastPage}`);
                console.log(`Current page: ${currentPage}`);

                document.querySelector('#ocUpdaterPage').textContent = `Page: ${currentPage}/${lastPage}`;


                // make edit url list
                let editUrls = [
                    ...document.querySelectorAll(
                        'a.btn.btn-primary[href*="route=account/extension/edit"]')
                ].map(link => link.href);

                // test=1 - only loop through 1st module of each page
                // or test=2 - only 1st module of 1st page
                if (test === '1' || test === '2') {
                    editUrls = [editUrls[0]];
                }

                console.log(`Found ${editUrls.length} edit URLs`);

                // keep list of urls so edit page can move to next edit page instead
                // of returning to list page
                sessionStorage.setItem('ocUpdaterEditUrls',JSON.stringify(editUrls));
                // keep index of url list index
                sessionStorage.setItem('ocUpdaterIndex','0');

                // Start with the first edit page
                window.location.href = editUrls[0];
                return;
            }
            // else it returned from an edit:



            const lastPage = parseInt(sessionStorage.getItem('ocUpdaterLastPage'), 10);
            const currentPage = parseInt(sessionStorage.getItem('ocUpdaterCurrentPage'), 10);
            // the index just edited:
            let editIndex = parseInt(sessionStorage.getItem('ocUpdaterIndex'), 10);
            const editUrls = JSON.parse(sessionStorage.getItem('ocUpdaterEditUrls'));

            document.querySelector('#ocUpdaterPage').textContent = `Page: ${currentPage}/${lastPage}`;
            document.querySelector('#ocUpdaterListing').textContent = `Listing: ${editIndex + 1}/${editUrls.length}`;

            // check if more listings to edit on this marketplace page
            if (editIndex < editUrls.length - 1) {
                // edit next listing
                // index of next page:
                editIndex++;
                sessionStorage.setItem('ocUpdaterIndex', editIndex);
                window.location.href = editUrls[editIndex];
                return;
            }
            // else continue to next page check:


            if (currentPage >= lastPage) {
                alert(`Reached the last page (${lastPage}). Update run complete.`);

                // reset all flags
                Object.keys(sessionStorage)
                .filter(key => key.startsWith('ocUpdater'))
                .forEach(key => sessionStorage.removeItem(key));

                sessionStorage.setItem('ocUpdaterStopped', 'true');
                document.querySelector('#ocUpdaterAction').textContent = 'Start Run';
                return;
                // should terminate, as no redirect means script doesn't run all over again
            }

            // alert(`Finished page ${currentPage}/${lastPage}.\nClick OK to go to page ${currentPage + 1}.`);

            // reset batch flags
            sessionStorage.removeItem('ocUpdaterBatchStarted');
            sessionStorage.removeItem('ocUpdaterEditUrls');
            sessionStorage.removeItem('ocUpdaterIndex');

            url.searchParams.set('page', currentPage + 1);
            window.location.href = url.toString();
            return;


        } else if (route === 'account/extension/edit') {
            // Edit-page code

            // check if sent here by program, else start program from list page
            // helps if rerunning program after crash on edit page
            const hasStarted = sessionStorage.getItem('ocUpdaterStarted');
            if (!hasStarted) {
                url.searchParams.set('route', 'account/extension');
                window.location.href = url.toString();
                return;
            }

            const lastPage = parseInt(sessionStorage.getItem('ocUpdaterLastPage'), 10);
            const currentPage = parseInt(sessionStorage.getItem('ocUpdaterCurrentPage'), 10);

            const editIndex = parseInt(sessionStorage.getItem('ocUpdaterIndex'), 10);
            const editUrls = JSON.parse(sessionStorage.getItem('ocUpdaterEditUrls'));

            //alert(`editing number ${editIndex+1}/${editUrls.length} edit page, ${currentPage}/${lastPage} pagination page`);
            document.querySelector('#ocUpdaterPage').textContent = `Page: ${currentPage}/${lastPage}`;
            document.querySelector('#ocUpdaterListing').textContent = `Listing: ${editIndex + 1}/${editUrls.length}`;

            // make page edit:
            // add reason
            const historyField = document.querySelector('#input-history');
            historyField.value = 'update';
            // set 'send email updates to purchasers' to no
            const alertNo = document.querySelector('input[name="alert"][value="0"]').checked = true;
            // submit
            document.querySelector('button[type="submit"]').click();
            return;
            // submit redirects back to list page

        } else {
            return;
        }



    }


    function createStatusPanel() {
        // Don't create it twice
        if (document.querySelector('#ocUpdaterPanel')) {
            return;
        }

        const panel = document.createElement('div');

        panel.id = 'ocUpdaterPanel';

        panel.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">
            OC Extension Updater
        </div>

        <div id="ocUpdaterPage">
            Page: -
        </div>

        <div id="ocUpdaterListing">
            Listing: -
        </div>

        <button id="ocUpdaterAction" style="margin-top: 10px;">
            Start Run
        </button>
    `;

        panel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 99999;
        background: white;
        color: black;
        border: 1px solid #999;
        border-radius: 5px;
        padding: 12px;
        width: 220px;
        font: 14px Arial, sans-serif;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    `;

        document.body.appendChild(panel);

        const button = document.querySelector('#ocUpdaterAction');

            if (sessionStorage.getItem('ocUpdaterStarted')) {
                button.textContent = 'Stop Run';
            }


        button.addEventListener('click', () => {

            if (sessionStorage.getItem('ocUpdaterStarted')) {
                // Stop
                Object.keys(sessionStorage)
                    .filter(key => key.startsWith('ocUpdater'))
                    .forEach(key => sessionStorage.removeItem(key));

                sessionStorage.setItem('ocUpdaterStopped', 'true');

                location.reload();
                return;
            }

            // Start
            Object.keys(sessionStorage)
                .filter(key => key.startsWith('ocUpdater'))
                .forEach(key => sessionStorage.removeItem(key));

            sessionStorage.removeItem('ocUpdaterStopped');

            location.reload();
        });
    }

    // wait for page to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
