import React, { Component } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { Text, View, Button, Overlay, Title, ImageBackground, Subtitle, Image } from "@shoutem/ui";
import EntypoIcon from "react-native-vector-icons/Entypo";
import Icon from "react-native-vector-icons/FontAwesome";

import SpinnerComponent from "../Components/Spinner";
import NabBarComponent from "../Components/NavBar";
import DropdownComponent from "../Components/DropdownAlert";

import { getConnectedUser, getConnectedUserTokens } from "../../DataAccess/ObjectsRepositories/UserRepository";
import {
	findNextOrCurrentTrip,
	getTrip,
	getLegsOfTripInformation
} from "../../DataAccess/ObjectsRepositories/TripRepository";
import { getDateToString } from "../../Functions";

export default class HomeScreen extends Component {
	constructor(props) {
		super(props);
		this.state = {
			userTokens: undefined,
			titleOfHeadBanner: "Pas de voyages prévus...",
			tripPeriod: undefined,
			tripInformation: undefined,
			currencySymbol: undefined,
			feedback: undefined,
			refreshing: false,
			disableTouch: false
		};
		this.setInitialState();
	}

	setInitialState = async () => {
		const userTokens = await getConnectedUserTokens();
		await this.setState({ userTokens: userTokens });
		this.setTripState();
	};

	setTripState = () => {
		const user = getConnectedUser(this.state.userTokens.login, this.state.userTokens.password);
		let trip = undefined;

		if (user.trips.length !== 0) {
			trip = findNextOrCurrentTrip(user);
		}
		if (trip !== undefined) {
			if (trip.period === "now") {
				this.setState({ titleOfHeadBanner: "En ce moment" });
			} else if (trip.period === "coming") {
				this.setState({ titleOfHeadBanner: "Prochainement" });
			}
			this.setState({
				tripPeriod: trip.period,
				tripInformation: trip.information,
				currencySymbol: user.currency.symbol
			});
		} else {
			this.setState({
				titleOfHeadBanner: "Pas de voyages prévus...",
				tripPeriod: undefined,
				tripInformation: undefined
			});
		}
	};

	getLegsOfTripFromTrip = () => {
		const user = getConnectedUser(this.state.userTokens.login, this.state.userTokens.password);
		const trip = getTrip(
			user,
			this.state.tripInformation.title,
			this.state.tripInformation.dateOfArrival,
			this.state.tripInformation.dateOfDeparture
		);

		return getLegsOfTripInformation(trip);
	};

	refreshScreen = () => {
		this.setState({ refreshing: true });
		this.setTripState();
		this.setState({ refreshing: false });
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
		if (this.state.userTokens === undefined) {
			return <SpinnerComponent />;
		} else {
			return (
				<View style={{ flex: 1 }}>
					<NabBarComponent title={"Accueil"} logoutButton={true} />
					<ScrollView
						refreshControl={
							<RefreshControl refreshing={this.state.refreshing} onRefresh={this.refreshScreen.bind(this)} />
						}
						contentContainerStyle={{ flex: 1 }}
					>
						<View styleName="headband">
							<Title>{this.state.titleOfHeadBanner}</Title>
						</View>

						<ImageBackground styleName={"image-home"} source={require("../Images/map.jpg")}>
							{this.state.tripInformation !== undefined ? (
								<Overlay styleName="image-overlay start">
									<Title>{this.state.tripInformation.title}</Title>
									<Subtitle styleName="legs-of-trips">{this.state.tripInformation.legsOfTrip}</Subtitle>
									<Subtitle styleName="period">
										Du {getDateToString(this.state.tripInformation.dateOfArrival)} au{" "}
										{getDateToString(this.state.tripInformation.dateOfDeparture)}
									</Subtitle>
									<Text styleName={"value"} style={{ marginTop: 45 }}>
										{this.state.tripInformation.totalBudget.totalBudgetSpent} {this.state.currencySymbol} /{" "}
										{this.state.tripInformation.totalBudget.totalBudgetPlanned} {this.state.currencySymbol}
									</Text>
									<Text styleName={"legend"}>(Budget dépensé / Budget plannifié)</Text>
									{this.state.tripPeriod === "coming" ? (
										<Button
											disabled={this.state.disableTouch}
											style={{ marginTop: 35 }}
											onPress={() => {
												this.disableTouch();
												this.props.navigation.navigate("HomeTrip", {
													isNewTrip: false,
													userTokens: this.state.userTokens,
													trip: {
														legsOfTrip: this.getLegsOfTripFromTrip(),
														lastState: {
															title: this.state.tripInformation.title,
															dateOfArrival: this.state.tripInformation.dateOfArrival,
															dateOfDeparture: this.state.tripInformation.dateOfDeparture
														}
													},
													callingScreen: "Home",
													refreshCallingScreen: this.refreshScreen
												});
											}}
										>
											<Text style={{ marginRight: 20 }}>Modifier mon voyage</Text>
											<EntypoIcon name="aircraft" size={25} color="white" />
										</Button>
									) : (
										<Button
											disabled={this.state.disableTouch}
											style={{ marginTop: 35 }}
											onPress={() => {
												this.disableTouch();
												this.props.navigation.navigate("HomeBudget", {
													userTokens: this.state.userTokens,
													tripStateForAuth: {
														title: this.state.tripInformation.title,
														dateOfArrival: this.state.tripInformation.dateOfArrival,
														dateOfDeparture: this.state.tripInformation.dateOfDeparture
													},
													callingScreen: "Home",
													refreshCallingScreen: this.refreshScreen
												});
											}}
										>
											<Text style={{ marginRight: 20 }}>Mon budget</Text>
											<Icon name="money" color="white" size={25} />
										</Button>
									)}
									{this.state.tripPeriod === "coming" ? (
										<Button
											disabled={this.state.disableTouch}
											style={{ marginTop: 15 }}
											onPress={() => {
												this.disableTouch();
												this.props.navigation.navigate("HomeBudget", {
													userTokens: this.state.userTokens,
													tripStateForAuth: {
														title: this.state.tripInformation.title,
														dateOfArrival: this.state.tripInformation.dateOfArrival,
														dateOfDeparture: this.state.tripInformation.dateOfDeparture
													},
													callingScreen: "Home",
													refreshCallingScreen: this.refreshScreen
												});
											}}
										>
											<Text style={{ marginRight: 20 }}>Modifier mon budget</Text>
											<Icon name="money" color="white" size={25} />
										</Button>
									) : (
										<Button
											disabled={this.state.disableTouch}
											style={{ marginTop: 15 }}
											onPress={() => {
												this.disableTouch();
											}}
										>
											<Text style={{ marginRight: 20 }}>Ajouter une dépense</Text>
											<EntypoIcon name="circle-with-plus" color="white" size={25} />
										</Button>
									)}
								</Overlay>
							) : (
								<Overlay styleName="image-overlay center">
									<Button
										disabled={this.state.disableTouch}
										onPress={() => {
											this.disableTouch();
											this.props.navigation.navigate("HomeTrip", {
												userTokens: this.state.userTokens,
												callingScreen: "Home"
											});
										}}
									>
										<Text style={{ marginRight: 20 }}>Ajouter un voyage</Text>
										<EntypoIcon name="circle-with-plus" color="white" size={25} />
									</Button>
									<Text style={{ marginTop: 5 }} styleName={"legend"}>
										Vous ne le regretterez pas ! ;-)
									</Text>
								</Overlay>
							)}
						</ImageBackground>
					</ScrollView>
					<DropdownComponent feedbackProps={this.state.feedback} />
				</View>
			);
		}
	}
}
