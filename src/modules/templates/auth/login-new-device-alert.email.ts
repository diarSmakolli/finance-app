export const alertNewLoginTemplate = (
  email: string,
  firstName: string,
  ip: string,
  time: string,
  appName: string,
  appUrl: string
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
                                                    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 20px; vertical-align: top; 
                                                    border-radius: 20px 20px 20px 20px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
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
                                                                            We noticed a successful login to your
                                                                            account from a new device.
                                                                        </span></p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>

                                                    <!-- <table border="0" cellpadding="0" cellspacing="0"
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
                                                                            Here are the details of the login: <br />
                                                                            Email: ${email} <br />
                                                                            IP address: ${ip} <br />
                                                                            Time: ${time} <br /><br />

                                                                            If this wasn't you, no further action
                                                                            needed. <br /><br />

                                                                            However, if you didn’t initiate this login,
                                                                            we strongly recommend that you:<br />

                                                                            <div style="margin-left:-20px">
                                                                                <ul
                                                                                    style="margin-top: 0; margin-bottom: 0; list-style-type: revert; font-family:-apple-system,'SF Pro Display','SF Pro Text','Helvetica',sans-serif;">
                                                                                    <li style="Margin: 0 0 0 0;"><span
                                                                                            style="word-break: break-word; color: #010001; font-family:-apple-system,'SF Pro Display','SF Pro Text','Helvetica',sans-serif;">
                                                                                            Change your password
                                                                                            immediately
                                                                                        </span></li>

                                                                                    <li
                                                                                        style="Margin: 0 0 0 0; font-family:-apple-system,'SF Pro Display','SF Pro Text','Helvetica',sans-serif;">
                                                                                        <span
                                                                                            style="word-break: break-word; color: #010001; font-family:-apple-system,'SF Pro Display','SF Pro Text','Helvetica',sans-serif;">
                                                                                            Review your account
                                                                                            activity.
                                                                                        </span>
                                                                                    </li>
                                                                                    <li
                                                                                        style="Margin: 0 0 0 0; font-family:-apple-system,'SF Pro Display','SF Pro Text','Helvetica',sans-serif;">
                                                                                        <span
                                                                                            style="word-break: break-word; color: #010001; font-family:-apple-system,'SF Pro Display','SF Pro Text','Helvetica',sans-serif;">
                                                                                            Enable two-factor
                                                                                            authentication if it's not
                                                                                            already enabled.
                                                                                        </span>
                                                                                    </li>
                                                                                </ul>
                                                                            </div>

                                                                            <p style="color: black;">
                                                                            If you have any questions or need 
                                                                            assistance, please don't hesitate to reach
                                                                            out to our support team.<br/><br/>
                                                                            

                                                                            Stay safe, <br/>
                                                                            The ${appName} Team
                                                                            </p>
                                                                        </span>
                                                                    </p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table> -->

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
                                        border-bottom-left-radius: 20px; border-bottom-right-radius: 20px;"
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
                                                                        Here are the details of the login: <br />
                                                                        Email: ${email} <br />
                                                                        IP address: ${ip} <br />
                                                                        Time: ${time} <br /><br />

                                                                        If this wasn't you, no further action
                                                                        needed. <br /><br />

                                                                        However, if you didn’t initiate this login,
                                                                        we strongly recommend that you:<br />
                                                                        <!-- 1. Change your password immediately.<br/>
                                                                        2. Review your account activity.<br/>
                                                                        3. Enable two-factor authentication if it's not already enabled.<br/><br/> -->

                                                                        <div style="margin-left:-20px">
                                                                            <ul
                                                                                style="margin-top: 0; margin-bottom: 0; list-style-type: revert; font-family:-apple-system,'SF Pro Display','SF Pro Text','Helvetica',sans-serif;">
                                                                                <li style="Margin: 0 0 0 0;"><span
                                                                                        style="word-break: break-word; color: #010001; font-family:-apple-system,'SF Pro Display','SF Pro Text','Helvetica',sans-serif;">
                                                                                        Change your password
                                                                                        immediately
                                                                                    </span></li>

                                                                                <li
                                                                                    style="Margin: 0 0 0 0; font-family:-apple-system,'SF Pro Display','SF Pro Text','Helvetica',sans-serif;">
                                                                                    <span
                                                                                        style="word-break: break-word; color: #010001; font-family:-apple-system,'SF Pro Display','SF Pro Text','Helvetica',sans-serif;">
                                                                                        Review your account
                                                                                        activity.
                                                                                    </span>
                                                                                </li>
                                                                                <li
                                                                                    style="Margin: 0 0 0 0; font-family:-apple-system,'SF Pro Display','SF Pro Text','Helvetica',sans-serif;">
                                                                                    <span
                                                                                        style="word-break: break-word; color: #010001; font-family:-apple-system,'SF Pro Display','SF Pro Text','Helvetica',sans-serif;">
                                                                                        Enable two-factor
                                                                                        authentication if it's not
                                                                                        already enabled.
                                                                                    </span>
                                                                                </li>
                                                                            </ul>
                                                                        </div>

                                                                        <p style="color: black;">
                                                                        If you have any questions or need 
                                                                        assistance, please don't hesitate to reach
                                                                        out to our support team.<br/><br/>
                                                                        

                                                                        Stay safe, <br/>
                                                                        The FinAI Team
                                                                        </p>
                                                                    </span>
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
                                                                    <p style="margin: 0;"><strong>XK 10000</strong>
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

</html>
`;