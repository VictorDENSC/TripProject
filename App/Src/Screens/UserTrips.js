import React, { Component } from "react";
import { View, Text, ListView, Subtitle, Icon, TouchableOpacity, Button, Row } from "@shoutem/ui";

import SpinnerComponent from "../Components/Spinner";
import NavBarComponent from "../Components/NavBar";
import DropdownAlertComponent from "../Components/DropdownAlert";

import { getConnectedUserTokens, getConnectedUser } from "../../DataAccess/ObjectsRepositories/UserRepository";
import { getDateToString } from "../../Functions";
import { getLegsOfTripInformation } from "../../DataAccess/ObjectsRepositories/TripRepository";

export default class UserTripsScreen extends Component {
	constructor(props) {
		super(props);
		this.state = {
			userTokens: undefined,
			trips: [],
			disableTouch: false,
			feedback: undefined
		};
		this.setInitialState();
	}

	setInitialState = async () => {
		const userTokens = await getConnectedUserTokens();
		await this.setState({ userTokens: userTokens });
		this.getUserTrips();
	};

	getUserTrips = () => {
		const user = getConnectedUser(this.state.userTokens.login, this.state.userTokens.password);

		let trips = [];

		user.trips.forEach(trip => {
			trips.push({ title: trip.title, dateOfArrival: trip.dateOfArrival, dateOfDeparture: trip.dateOfDeparture });
		});

		this.setState({ trips: trips, feedback: this.checkIfFeedback() });
	};

	//Permet d'afficher un message après l'ajout d'un utilisateur
	checkIfFeedback = () => {
		//Ces paramètres sont envoyés par la page SignUp
		//Vaut withFeedback si défini et false sinon
		const withFeedback = this.props.navigation.getParam("withFeedback", false);
		if (withFeedback === true) {
			const { params } = this.props.navigation.state;
			setTimeout(() => {
				this.setState({
					feedback: undefined
				});
			}, 2000);
			return { type: params.type, title: params.title, text: params.text };
		}
	};

	getLegsOfTripFromTrip = trip => {
		const user = getConnectedUser(this.state.userTokens.login, this.state.userTokens.password);
		const trips = user.trips;

		const legsOfTrip = [];

		const tripSelected = trips.find(userTrip => {
			return (
				userTrip.title === trip.title &&
				userTrip.dateOfArrival - trip.dateOfArrival === 0 &&
				userTrip.dateOfDeparture - trip.dateOfDeparture === 0
			);
		});

		return getLegsOfTripInformation(tripSelected);
	};

	renderRow = trip => {
		return (
			<TouchableOpacity
				disabled={this.state.disableTouch}
				onPress={() => {
					this.disableTouch();
					if (!this.state.disableTouch) {
						this.props.navigation.navigate("Trip", {
							isNewTrip: false,
							userTokens: this.state.userTokens,
							trip: {
								legsOfTrip: this.getLegsOfTripFromTrip(trip),
								lastState: {
									title: trip.title,
									dateOfArrival: trip.dateOfArrival,
									dateOfDeparture: trip.dateOfDeparture
								}
							}
						});
					}
				}}
				styleName="custom"
			>
				<Row>
					<View styleName="vertical">
						<Subtitle styleName="title">{trip.title}</Subtitle>
						<Text numberOfLines={1}>
							Du {getDateToString(trip.dateOfArrival)} au {getDateToString(trip.dateOfDeparture)}
						</Text>
					</View>
					<Icon styleName="disclosure" name="right-arrow" />
				</Row>
			</TouchableOpacity>
		);
	};

	disableTouch = () => {
		this.setState({ disableTouch: true });
		setTimeout(() => {
			this.setState({
				disableTouch: false
			});
		}, 2000);
	};

	render() {
		if (this.state.userTokens === undefined || this.state.trips === undefined) {
			return <SpinnerComponent />;
		} else {
			return (
				<View style={{ flex: 1 }}>
					<NavBarComponent title={"Mes voyages"} logoutButton={true} />
					<ListView data={this.state.trips} renderRow={this.renderRow} />
					<View style={{ alignItems: "flex-end", marginBottom: 10, marginRight: 10 }}>
						<Button
							disabled={this.state.disableTouch}
							styleName="rounded-button"
							style={{ backgroundColor: "green" }}
							onPress={() => {
								this.disableTouch();
								this.props.navigation.navigate("Trip", { userTokens: this.state.userTokens });
							}}
						>
							<Icon name="plus-button" />
						</Button>
					</View>
					<DropdownAlertComponent feedbackProps={this.state.feedback} />
				</View>
			);
		}
	}
}
