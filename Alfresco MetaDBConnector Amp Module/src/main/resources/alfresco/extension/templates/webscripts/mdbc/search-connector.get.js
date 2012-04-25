/*
 *    Copyright (C) 2012 Venzia, S.L. All rights reserved.
 *
 *    This program is free software: you can redistribute it and/or modify
 *    it under the terms of the GNU General Public License as published by
 *    the Free Software Foundation, either version 3 of the License, or
 *    (at your option) any later version.
 *
 *    This program is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *    GNU General Public License for more details.
 *
 *    You should have received a copy of the GNU General Public License
 *    along with this program. If not, see <http://www.gnu.org/licenses/>.
 *    
 */

var connectorName = args["connector"].replace("prop_mdbc_","");
var result = mdbcServiceRegistry.searchDataConnector(connectorName,args.search);
if(result!=null){
	model.success = true;
	model.msg = "ok";
	model.result = result;
} else {
	status.code = 400;
	status.message = "Error on searchDataConnector";
	status.redirect = true;
	logger.log("Error on searchDataConnector");
}

