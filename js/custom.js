$(document).ready(function(){
    $(function () {
      $('[data-toggle="tooltip"]').tooltip()
    })
    $("#input").submit(function(event){
        event.preventDefault();
        var JIRATEXT = "Jira Tickets:"
        var JIRABUCKET = "openapis"

        var addedInput = $('#added').val()
        var addedPRs = addedInput.split(',');
        var addValue = null
        var error = false;
        var errorMsg = "There appears to be something wrong, try again.";
        if(addedPRs.indexOf($('#inputPR').val()) != -1){
            error = true
            errorMsg = "You have already added this PR."
        }
        if(addedInput.length == 0){
            addValue = $('#added').val()+$('#inputPR').val()
        }else{
            addValue = $('#added').val()+"," + $('#inputPR').val()
        }
        $('#added').val(addValue)
        var pr = "/" + $('#inputPR').val()
        $('#inputPR').val("")
        if(error){
            $("#inputContainer").append("<div id='warningMsg' class='alert alert-danger alert-dismissible' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>Warning!</strong> "+errorMsg+"</div>")
        }else{
            $.ajax({
                url: "https://github.disney.com/api/v3/repos/espn-api-platform/allsports-apis/pulls"+pr,
                data: {
                    _accept: "application/json"
                },
                dataType: "jsonp",
                success: function(data) {
                    var req = data.data
                    if(req.message == "Not Found"){
                        error = true
                        errorMsg = "This PR doesn't seem to exist. Try again."
                    }
                    if(error){
                        $("#inputContainer").append("<div id='warningMsg' class='alert alert-danger alert-dismissible' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>Warning!</strong> "+errorMsg+"</div>")
                    }else{
                        var inputAPI = $('#inputAPI').val()
                        var inputAPIFull = inputAPI+" API:"
                        var description = null
                        var ticketLink = null
                        var files = null

                        var descripInd = req.title.indexOf(":")
                        var inputAPIFullLength = inputAPIFull.length
                        var regex = /openapis[0-9]{1,5}|\bOPENAPIS\b[\s]?[\s\-:][\s]?[0-9]{1,5}/i //\w*"openapis"[0-9]{1,5}\w*|
                        var ticketTmp = req.title.match(regex)
                        if(ticketTmp == null || ticketTmp.length < 0){
                            ticketTmp = req.head.label.match(regex)
                            if(ticketTmp == null || ticketTmp.length < 0){
                                ticketTmp = ["[ticket]"]
                            }
                        }
                        ticket = ticketTmp[0].replace(" ","-")
                        if(ticket.indexOf("-") == -1){
                            ticket = ticket.slice(0,JIRABUCKET.length) + "-" + ticket.slice(JIRABUCKET.length)
                        }
                        description = (descripInd > -1) ? "("+ticket+") "+$.trim(req.title.substr(descripInd+1,req.title.length)) :"("+ticket+") "+ "[description]"
                        ticketLink = "https://espnjira.disney.com/browse/"+ticket.toLowerCase()
                        var notes = $("#releaseNotes")
                        var notesText = notes.text()
                        var notesLength = notesText.length
                        var jiraLength = JIRATEXT.length
                        if(notesLength > 0){
                            var apiIndex = notesText.indexOf(inputAPIFull)
                            var jiraIndex = notesText.indexOf(JIRATEXT)
                            if(apiIndex > -1 ){
                                notes.text(notesText.slice(apiIndex,inputAPIFullLength) + "\n"+description + notesText.slice(inputAPIFullLength,jiraIndex+jiraLength) + "\n"+ticketLink + notesText.slice(jiraIndex+jiraLength))
                            }else{
                                 notes.text(notesText.slice(0,jiraIndex+jiraLength) + "\n"+ticketLink + notesText.slice(jiraIndex+jiraLength))
                                 notes.prepend(inputAPIFull+"\n"+description+"\n\n")
                            }
                        }else{
                            $("#releaseNotes").text(inputAPIFull + "\n"+description+"\n\n"+"Jira Tickets:\n"+ticketLink+"\n")
                        }
                        getChangedFiles(req.url+"/files")
                    }
                },
                error: function(err) {
                     console.log(err.message)
                }
            });
        }
    })
});

function getChangedFiles(link){
    var files = [];
    var FILESTEXT = "Files Affected:"
    $.ajax({
        url: link,
        data: {
            _accept: "application/json"
        },
        dataType: "jsonp",
        success: function(data) {
            var req = data.data
            if(req.message == "Not Found"){
                alert("Did not find that Pull Request Number\n \nTry again")
            }else{
                $.each(req,function(){
                    var file = $(this)[0]
                    files[files.length] = file.filename
                })
                if($("#releaseNotes").text().indexOf(FILESTEXT) == -1){
                    $("#releaseNotes").append("\n"+FILESTEXT+"\n")
                }
                $.each(files,function(ind,val){
                    if($("#releaseNotes").text().indexOf(val) == -1){
                        $("#releaseNotes").append(val+"\n")
                    }
                })
                $("#emailLink").attr("href","mailto:chasani.j.douglas@espn.com?subject='Release Notes'&body=" + $("#releaseNotes").text().replace(/[\n]/g,"%0A"))
                $("#emailButton").removeAttr("disabled")
            }
        },
        error: function(err) {
             console.log(err.message)
        }
    });
}