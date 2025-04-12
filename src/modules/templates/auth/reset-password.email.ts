export const resetPasswordEmailTemplate = (
    email: string,
    resetLink: string,
    firstName: string,
    AppName: string,
    AppUrl: string,
    SupportEmail: string,
) => `
    <!DOCTYPE html>
<html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">

<head>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet" type="text/css" />
    <link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet" type="text/css" />
    <link href="https://fonts.googleapis.com/css2?family=Lato:wght@100;200;300;400;500;600;700;800;900" rel="stylesheet"
        type="text/css" />
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@300;400;500;600;700;800&display=swap');

        * {
            box-sizing: border-box;
        }


        body {
            margin: 0;
            padding: 0;
        }

        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: inherit !important;
        }

        #MessageViewBody a {
            color: inherit;
            text-decoration: none;
        }

        p {
            line-height: inherit
        }

        .desktop_hide,
        .desktop_hide table {
            mso-hide: all;
            display: none;
            max-height: 0px;
            overflow: hidden;
        }

        .image_block img+div {
            display: none;
        }

        sup,
        sub {
            line-height: 0;
            font-size: 75%;
        }

        #converted-body .list_block ul,
        #converted-body .list_block ol,
        .body [class~="x_list_block"] ul,
        .body [class~="x_list_block"] ol,
        u+.body .list_block ul,
        u+.body .list_block ol {
            padding-left: 20px;
        }

        @media (max-width:720px) {

            .desktop_hide table.icons-inner,
            .social_block.desktop_hide .social-table {
                display: inline-block !important;
            }

            .icons-inner {
                text-align: center;
            }

            .icons-inner td {
                margin: 0 auto;
            }

            .mobile_hide {
                display: none;
            }

            .row-content {
                width: 100% !important;
            }

            .stack .column {
                width: 100%;
                display: block;
            }

            .mobile_hide {
                min-height: 0;
                max-height: 0;
                max-width: 0;
                overflow: hidden;
                font-size: 0px;
            }

            .desktop_hide,
            .desktop_hide table {
                display: table !important;
                max-height: none !important;
            }
        }
    </style>
</head>

<body class="body"
    style="background-color: #fefffe; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
    <table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation"
        style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #fefffe;" width="100%">
        <tbody>
            <tr>
                <td>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-1"
                        role="presentation"
                        style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f9fc;" width="100%">
                        <tbody>
                            <tr>
                                <td>
                                    <table align="center" border="0" cellpadding="0" cellspacing="0"
                                        class="row-content stack" role="presentation"
                                        style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f9fc; color: #000000; width: 700px; margin: 0 auto;"
                                        width="700">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1"
                                                    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
                                                    width="100%">
                                                    <div class="spacer_block block-1"
                                                        style="height:30px;line-height:30px;font-size:1px;"> </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>


                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2"
                        role="presentation"
                        style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f9fc;" width="100%">
                        <tbody>
                            <tr>
                                <td>
                                    <table align="center" border="0" cellpadding="0" cellspacing="0"
                                        class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #fefffe; margin-top: 50px !important; color: #000000; 
										width: 700px; margin: 0 auto; border-top-left-radius: 20px; border-top-right-radius: 20px;" width="700">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1"
                                                    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 20px; vertical-align: top; border-radius: 20px 20px 20px 20px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
                                                    width="100%">
                                                    <table border="0" cellpadding="0" cellspacing="0"
                                                        class="paragraph_block block-1" role="presentation"
                                                        style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;"
                                                        width="100%">
                                                        <tr>


                                                            <td class="pad"
                                                                style="padding-left:30px;padding-right:30px;padding-top:10px;">
                                                                <div
                                                                    style="color:white;font-family:'Montserrat','Trebuchet MS','Lucida Grande','Lucida Sans Unicode','Lucida Sans',Tahoma,sans-serif;font-size:32px;line-height:120%;text-align:left;mso-line-height-alt:38.4px;">

                                                                    <p
                                                                        style="margin: 0; word-break: break-word; margin-top: 20px;">
                                                                        <span style="word-break: break-word; color: #010001; font-size: 25px;
                                                                            font-family:-apple-system,'SF Pro Display','SF Pro Text','Helvetica',sans-serif;
                                                                            ">
                                                                            Hi,
                                                                            ${firstName}</span>
                                                                    </p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>


                                                    <table border="0" cellpadding="0" cellspacing="0"
                                                        class="paragraph_block block-2" role="presentation"
                                                        style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;"
                                                        width="100%">
                                                        <tr>
                                                            <td class="pad"
                                                                style="padding-bottom:5px;padding-left:30px;padding-right:30px;padding-top:15px;">
                                                                <div
                                                                    style="color:#7c7c7c;font-family:-apple-system,'SF Pro Display','SF Pro Text','Helvetica',sans-serif;font-size:16px;line-height:150%;text-align:left;mso-line-height-alt:24px;">
                                                                    <p style="margin: 0;"><span
                                                                            style="word-break: break-word; color: #010001;">
                                                                            We received a request to reset a password
                                                                            for your ${AppName} account.
                                                                            <br /><br/>
                                                                            If you made this request, please click the
                                                                            link below to reset your password.
                                                                            <br />


                                                                        </span></p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>

                                                    <table border="0" cellpadding="0" cellspacing="0"
                                                        class="paragraph_block block-3" role="presentation"
                                                        style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #fefffe; color: #000000; width: 700px; margin: 0 auto;"
                                                        width="100%">
                                                        <tr>
                                                            <td class="pad"
                                                                style="padding-left:30px;padding-right:30px;padding-top:15px;">
                                                                <div
                                                                    style="background-color:#635BFF;
                                                                                                    border-bottom:0px solid transparent;
                                                                                                    border-left:0px solid transparent;
                                                                                                    border-radius:7px;
                                                                                                    border-right:0px solid transparent;
                                                                                                    border-top:0px solid transparent;
                                                                                                    color:#fff;
                                                                                                    display:block;
                                                                                                    font-family:-apple-system,'SF Pro Display','SF Pro Text','Helvetica',sans-serif;
                                                                                                    font-size:22px;mso-border-alt:none;
                                                                                                    padding-bottom:0px;padding-top:0px;text-align:center;
                                                                                                    text-decoration:none;
                                                                                                    width:30%;word-break:keep-all;">
                                                                    <span
                                                                        style="word-break: break-word; padding-left: 0px; padding-right: 0px; 
                                                                                                        font-size: 18px; display: inline-block; letter-spacing: normal; font-weight: bold !important;">
                                                                        <a href="${resetLink}"
                                                                            style="text-decoration: none;">
                                                                            <span
                                                                                style="word-break: break-word; line-height: 44px; color: #fff; font-weight: bold !important;">
                                                                                Reset password
                                                                            </span>
                                                                        </a>
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>





                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>


                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-3"
                        role="presentation"
                        style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f9fc;" width="100%">
                        <tbody>
                            <tr>
                                <td>
                                    <table align="center" border="0" cellpadding="0" cellspacing="0"
                                        class="row-content stack" role="presentation"
                                        style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #fefffe; color: #000000; width: 700px; margin: 0 auto;
                                        padding-bottom: 20px;
                                        border-top-left-radius: 0px; border-top-right-radius: 0px; border-bottom-left-radius: 20px; border-bottom-right-radius: 20px;"
                                        width="700">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1"
                                                    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-left: 5px; padding-right: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
                                                    width="100%">
                                                    <table border="0" cellpadding="0" cellspacing="0"
                                                        class="paragraph_block block-3" role="presentation"
                                                        style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;"
                                                        width="100%">
                                                        <tr>
                                                            <td class="pad"
                                                                style="padding-left:30px;padding-right:30px;padding-top:15px;">
                                                                <div
                                                                    style="color:#7c7c7c;font-family:-apple-system,'SF Pro Display','SF Pro Text','Helvetica',sans-serif;font-size:16px;line-height:150%;text-align:left;mso-line-height-alt:24px;">
                                                                    <p style="margin: 0;">
                                                                        <span
                                                                            style="word-break: break-word; color: #010001;">
                                                                            If you didn’t request a password reset,
                                                                            please ignore this email. Your account will
                                                                            remain secure. <br />
                                                                            
                                                                            <br />
                                                                            For security reasons, the link will expire
                                                                            in 1 hour.
                                                                        </span>
                                                                    </p>

                                                                    <br />

                                                                    <p style="margin: 0;">
                                                                        <span
                                                                            style="word-break: break-word; color: #010001;">
                                                                            If you’re having trouble in clicking
                                                                            button please go to the link directly:
                                                                            
                                                                            <a href="${resetLink}"
                                                                                style="color: #635BFF; text-decoration: none;">
                                                                                <span
                                                                                    style="word-break: break-word; color: #635BFF;">
                                                                                    ${resetLink}
                                                                                </span>
                                                                        </span>
                                                                    </p>
                                                                    
                                                                    <br/>
                                                                    <p style="margin: 0; color: black;">
                                                                        
                                                                            All the best <br />
                                                                            
                                                                            
                                                                            The ${AppName} Team
                                                                        
                                                                    </p>

                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>

                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Footer  -->

                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-5"
                        role="presentation"
                        style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f9fc;" width="100%">
                        <tbody>
                            <tr>
                                <td>
                                    <table align="center" border="0" cellpadding="0" cellspacing="0"
                                        class="row-content stack" role="presentation"
                                        style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f9fc; color: #000000; width: 700px; margin: 0 auto;"
                                        width="700">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1"
                                                    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 35px; padding-top: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
                                                    width="100%">
                                                    <table border="0" cellpadding="0" cellspacing="0"
                                                        class="paragraph_block block-1" role="presentation"
                                                        style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;"
                                                        width="100%">
                                                        <tr>
                                                            <td class="pad"
                                                                style="padding-left:30px;padding-right:30px;padding-top:15px;">
                                                                <div
                                                                    style="color:#7C7C7C;font-family:Open Sans, Helvetica Neue, Helvetica, Arial, sans-serif;font-size:14px;line-height:180%;text-align:center;mso-line-height-alt:25.2px;">
                                                                    <p style="margin: 0;"><strong>
                                                                        XK, 10000
                                                                    </strong>
                                                                    </p>

                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <!--  -->
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table><!-- End -->
</body>

</html>`;